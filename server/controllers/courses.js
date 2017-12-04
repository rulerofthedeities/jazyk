const response = require('../response'),
      mongoose = require('mongoose'),
      Course = require('../models/course').model,
      UserCourse = require('../models/usercourse').model;

let getCourse = function(req, res, authorOnly) {
  if (mongoose.Types.ObjectId.isValid(req.params.courseId)) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId);
    let query = {_id: courseId, isPublished: true, isPublic: true};
    if (authorOnly) {
      const userId = new mongoose.Types.ObjectId(req.decoded.user._id);
      query = {_id: courseId, authorId: userId};
    }
    Course.findOne(query, {}, function(err, course) {
      response.handleError(err, res, 500, 'Error fetching course', function(){
        response.handleSuccess(res, course, 200, 'Fetched course');
      });
    });
  } else {
    //invalid id
    response.handleSuccess(res, null, 404, 'Invalid course id');
  }
}

module.exports = {
  getPublishedLanCourses: function(req, res) {
    const languageId = req.params.lan;
    const query = {
      isPublished: true,
      isPublic: true,
      isInProgress: false
    }
    if (languageId !== 'eu') {
      query['languagePair.to'] = languageId;
    }
    Course.find(query, {}, function(err, courses) {
      response.handleError(err, res, 500, 'Error fetching courses', function(){
        response.handleSuccess(res, courses, 200, 'Fetched courses');
      });
    });
  },
  getSubscribedCourses: function(req, res) {
    // Get all courses that this user is currently learning
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id);
    // Find all courseIds for this user
    UserCourse.find({userId, subscribed: true}, function(err, userCourses) {
      response.handleError(err, res, 500, 'Error fetching user courses', function(){
        const courseIdArr = [];
        userCourses.forEach(course => courseIdArr.push(course.courseId));
        const query = {_id: {$in: courseIdArr}};
        // Find courses with the courseIds
        Course.find(query, {},  function(err, courses) {
          response.handleError(err, res, 500, 'Error fetching user courses', function(){
            response.handleSuccess(res, {subscribed: courses, data: userCourses}, 200, 'Fetched user courses');
          });
        });
      });
    });
  },
  getUserCreatedCourses: function(req, res) {
    // Get all courses that this user has created
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id);
    Course.find({authorId: userId}, {}, function(err, courses) {
      response.handleError(err, res, 500, 'Error fetching user created courses', function(){
        response.handleSuccess(res, courses, 200, 'Fetched user created courses');
      });
    })
  },
  getDemoCourses : function(req, res) {
    const query = {demo: true, isPublished: true, isInProgress: false};
    Course.find(query, {}, function(err, courses) {
      response.handleError(err, res, 500, 'Error fetching demo courses', function(){
        response.handleSuccess(res, courses, 200, 'Fetched demo courses');
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
    const userId = new mongoose.Types.ObjectId(req.params.userId),
          query = {creatorId: userId, isPublic: true, isPublished: true},
          projection = {name:1, image:1, totalCount: 1, languagePair:1},
          sort = {sort: {totalCount: -1}};
    Course.find(query, projection, sort, function(err, courses) {
      response.handleError(err, res, 500, 'Error fetching teaching courses', function(){
        response.handleSuccess(res, courses, 200, 'Fetched teaching courses');
      });
    })
  },
  addCourse: function(req, res) {
    const course = new Course(req.body),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id);
    course._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID
    course.creatorId = userId;
    course.authorId = [userId];

    course.save(function(err, result) {
      response.handleError(err, res, 500, 'Error adding new course', function(){
        response.handleSuccess(res, result, 200, 'Added new course');
      });
    });
  },
  updateCourseHeader: function(req, res) {
    const course = new Course(req.body),
          courseId = new mongoose.Types.ObjectId(course._id),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {_id: courseId, authorId: userId},
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
      response.handleError(err, res, 500, 'Error updating course', function(){
        response.handleSuccess(res, result, 200, 'Updated course');
      });
    });
  },
  updateCourseProperty: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {_id: courseId, authorId: userId},
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
        response.handleError(err, res, 500, 'Error updating ' + key, function(){
          response.handleSuccess(res, result, 200, 'Updated ' + key);
        });
      });
    }
  },
  updateCourseLesson: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lesson = req.body,
          upd = {
      $addToSet: { 'lessons.$.lessonIds': lesson.lessonId}
    };

    Course.findOneAndUpdate(
      {_id: courseId, authorId: userId, 'lessons.chapter': lesson.chapterName}, upd, function(err, result) {
      response.handleError(err, res, 500, 'Error updating course lesson', function(){
        response.handleSuccess(res, result, 200, 'Updated course lesson');
      });
    });
  },
  addChapter: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          chapter = req.body;

    Course.findOneAndUpdate(
      {_id: courseId, authorId: userId},
      {$addToSet: {
        chapters: chapter.chapterName,
        lessons: chapter.lesson
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error adding chapter', function(){
        response.handleSuccess(res, result, 200, 'Added chapter');
      });
    });
  },
  getChapters: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);

    Course.find({_id: courseId}, {_id: 0, chapters: 1}, function(err, result) {
      response.handleError(err, res, 500, 'Error fetching chapters', function(){
        response.handleSuccess(res, result, 200, 'Fetched chapters');
      });
    });
  },
  removeChapter: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          chapter = req.body.name;

    Course.findOneAndUpdate(
      {_id: courseId, authorId: userId},
      { $pull: { chapters: chapter }}, function(err, result) {
      response.handleError(err, res, 500, 'Error removing chapter "' + chapter + '"', function(){
        response.handleSuccess(res, result, 200, 'Removed chapter "' + chapter + '"');
      });
    });
  },
  updateChapters: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          chapters = req.body;

    Course.findOneAndUpdate(
      {_id: courseId, authorId: userId},
      {$set: {
        chapters: chapters
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating chapters', function(){
        response.handleSuccess(res, result, 200, 'Updated chapters');
      });
    });
  },
  updateLessonIds: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonIds = req.body;

    Course.findOneAndUpdate(
      {_id: courseId, authorId: userId},
      {$set: {
        lessons: lessonIds
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating lesson Ids', function(){
        response.handleSuccess(res, result, 200, 'Updated lesson Ids');
      });
    });
  }
}
