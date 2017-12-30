const response = require('../response'),
      mongoose = require('mongoose'),
      access = require('./access'),
      Course = require('../models/course').model,
      UserCourse = require('../models/usercourse').model;

let getCourse = function(req, res, authorOnly) {
  if (mongoose.Types.ObjectId.isValid(req.params.courseId)) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          query = {
            _id: courseId,
            isPublished: true,
            isPublic: true
          };
    if (authorOnly) {
      const userId = new mongoose.Types.ObjectId(req.decoded.user._id);
      query = {
        _id: courseId,
        access: access.checkAccess(userId, 2) // Must be at least author;
      };
    }
    Course.findOne(query, {}, function(err, course) {
      response.handleError(err, res, 400, 'Error fetching course', function(){
        response.handleSuccess(res, course, 200, 'Fetched course');
      });
    });
  } else {
    //invalid id
    response.handleSuccess(res, null, 404, 'Invalid course id');
  }
}

let moveLesson = function(lessons, newChapter, lessonId, query, res, cb) {
  console.log('moving lesson ' + lessonId + ' to', newChapter);
  // Check if lessonId is in existing chapters
  const newLessons = [];
  let changed = false,
      lessonIds,
      remaining;
  lessons.forEach(lesson => {
    lessonIds = lesson.lessonIds;
    if (lesson.chapter === newChapter.chapterName) {
      remaining = lessonIds;
    } else {
      remaining = lessonIds.filter(id => id !== lessonId.toString());
    }
    if (remaining.length !== lessonIds.length) {
      changed = true;
    }
    newLessons.push({lessonIds: remaining, chapter: lesson.chapter});
  });
  if (changed && lessons.length === newLessons.length) {
    //save updated lesson subdocument
    const update = {$set: {lessons: newLessons}};
    Course.findOneAndUpdate(query, update, function(err, result) {
      cb(err, result);
    });
  } else {
    cb(null, null);
  }
}

module.exports = {
  getPublishedLanCourses: function(req, res) {
    const languageId = req.params.lan,
          query = {
            isPublished: true,
            isPublic: true,
            isInProgress: false
          }
    if (languageId !== 'eu') {
      query['languagePair.to'] = languageId;
    }
    Course.find(query, {}, function(err, courses) {
      response.handleError(err, res, 400, 'Error fetching courses', function(){
        response.handleSuccess(res, courses, 200, 'Fetched courses');
      });
    });
  },
  getSubscribedCourses: function(req, res) {
    // Get all courses that this user is currently learning
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            userId,
            subscribed: true
          };
    // Find all courseIds for this user
    UserCourse.find(query, function(err, userCourses) {
      response.handleError(err, res, 400, 'Error fetching user courses', function(){
        const courseIdArr = [];
        userCourses.forEach(course => courseIdArr.push(course.courseId));
        const query = {
          _id: {$in: courseIdArr}
        };
        // Find courses with the courseIds
        Course.find(query, {},  function(err, courses) {
          response.handleError(err, res, 400, 'Error fetching user courses', function(){
            response.handleSuccess(res, {subscribed: courses, data: userCourses}, 200, 'Fetched user courses');
          });
        });
      });
    });
  },
  getAuthorCourses: function(req, res) {
    // Get all courses that this user has author access to
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            access: access.checkAccess(userId, 2) // Must be at least author;
          }
    Course.find(query, {}, function(err, courses) {
      response.handleError(err, res, 400, 'Error fetching user created courses', function(){
        response.handleSuccess(res, courses, 200, 'Fetched user created courses');
      });
    })
  },
  getDemoCourses : function(req, res) {
    const query = {
      isDemo: true,
      isPublished: true,
      isInProgress: false
    };
    Course.find(query, {}, function(err, courses) {
      console.log('getting demo courses', courses);
      response.handleError(err, res, 400, 'Error fetching demo courses', function(){
        response.handleSuccess(res, {subscribed: courses, isDemo: true}, 200, 'Fetched demo courses');
      });
    })
  },
  getCourse: function(req, res) {
    // Get course in learn mode
    getCourse(req, res, false);
  },
  getAuthorCourse: function(req, res) {
    // get course in author mode
    getCourse(req, res, true);
  },
  getTeachingCourses: function(req, res) {
    // get courses for profile
    const userId = req.params.userId,
          query = {
            access: access.checkAccess(userId, 4), // Must be at least manager
            isPublic: true,
            isPublished: true
          },
          projection = {
            name:1,
            image:1,
            totalCount: 1,
            languagePair:1
          },
          options = {
            sort: {totalCount: -1}
          };
    Course.find(query, projection, options, function(err, courses) {
      response.handleError(err, res, 400, 'Error fetching teaching courses', function(){
        response.handleSuccess(res, courses, 200, 'Fetched teaching courses');
      });
    })
  },
  addCourse: function(req, res) {
    const course = new Course(req.body),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id);
    course._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID
    course.creatorId = userId;
    course.access = [{userId, level: 5}]; // owner

    course.save(function(err, result) {
      response.handleError(err, res, 400, 'Error adding new course', function(){
        response.handleSuccess(res, result, 200, 'Added new course');
      });
    });
  },
  updateCourseHeader: function(req, res) {
    const course = new Course(req.body),
          courseId = new mongoose.Types.ObjectId(course._id),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            _id: courseId,
            access: access.checkAccess(userId, 4) // Must be at least manager
            },
          update = {
            name: course.name,
            description: course.description,
            defaults: course.defaults,
            isPublic: course.isPublic,
            isInProgress: course.isInProgress
          };
    if (course.isPublished) {
      update.isPublished = true; // you cannot unpublish
      update['dt.published'] = Date.now();
    }
    if (!course.isInProgress) {
      update['dt.completed'] = Date.now();
    }
    Course.findOneAndUpdate(query, {$set: update}, function(err, result) {
      response.handleError(err, res, 400, 'Error updating course', function(){
        response.handleSuccess(res, result, 200, 'Updated course');
      });
    });
  },
  updateCourseProperty: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {_id: courseId, access: access.checkAccess(userId, 4)}, // Must be at least manager
          property = req.body,
          update = property;
    let key = Object.keys(property)[0];
    if (key === 'isPublished') {
      if (property.isPublished) {
        update['dt.published'] = Date.now();
      } else {
        key = 'ignore'; // you cannot unpublish
      }
    }
    if (key === 'isInProgress' && !property.isInProgress) {
      update['dt.completed'] = Date.now();
    }
    if (key === 'isPublic' || key === 'isPublished' || key === 'isInProgress') {
      Course.findOneAndUpdate(query, update, function(err, result) {
        response.handleError(err, res, 400, 'Error updating ' + key, function(){
          response.handleSuccess(res, result, 200, 'Updated ' + key);
        });
      });
    }
  },
  updateCourseLesson: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lesson = req.body,
          query = {
            _id: courseId,
            access: access.checkAccess(userId, 3), // at least editor
            'lessons.chapter': lesson.chapterName
          },
          update = {
            $addToSet: {'lessons.$.lessonIds': lesson.lessonId}
          };

    Course.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error updating course lesson', function(){
        response.handleSuccess(res, result, 200, 'Updated course lesson');
      });
    });
  },
  addChapter: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          chapter = req.body,
          query = {
            _id: courseId,
            access: access.checkAccess(userId, 3) // at least editor
          },
          update = {$addToSet: {
            chapters: chapter.chapterName,
            lessons: chapter.lesson
          }};

    Course.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error adding chapter', function(){
        // Check if lesson exists in another chapter; if so, remove it.
        moveLesson(result.lessons, chapter, lessonId, query, res, function(err, result) {
          response.handleError(err, res, 400, 'Error moving chapter', function(){
            response.handleSuccess(res, result, 200, 'Moved chapter');
          });
        });
      });
    });
  },
  getChapters: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id),
          query = {_id: courseId},
          projection = {_id: 0, chapters: 1};

    Course.find(query, projection, function(err, result) {
      response.handleError(err, res, 400, 'Error fetching chapters', function(){
        response.handleSuccess(res, result, 200, 'Fetched chapters');
      });
    });
  },
  removeChapter: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          chapter = req.body.name,
          query = {
            _id: courseId,
            access: access.checkAccess(userId, 3) // at least editor
          },
          chapterUpdate = {
            $pull: {
              chapters: chapter,
              lessons: {chapter}
            }
          };

    Course.findOneAndUpdate(query, chapterUpdate, function(err, result) {
      response.handleError(err, res, 400, 'Error removing chapter "' + chapter + '"', function(){
        response.handleSuccess(res, result, 200, 'Removed chapter "' + chapter + '"');
      });
    });
  },
  updateChapters: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          chapters = req.body,
          query = {
            _id: courseId,
            access: access.checkAccess(userId, 3) // at least editor
          },
          update = {$set: {
            chapters: chapters
          }};

    Course.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error updating chapters', function(){
        response.handleSuccess(res, result, 200, 'Updated chapters');
      });
    });
  },
  updateLessonIds: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonIds = req.body,
          query = {
            _id: courseId,
            access: access.checkAccess(userId, 3) // at least editor
          },
          update = {$set: {
            lessons: lessonIds
          }};

    Course.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error updating lesson Ids', function(){
        response.handleSuccess(res, result, 200, 'Updated lesson Ids');
      });
    });
  }
}
