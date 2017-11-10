const response = require('../response'),
      mongoose = require('mongoose'),
      Course = require('../models/course'),
      UserCourse = require('../models/usercourse');

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
    response.handleSuccess(res, null, 200, 'Invalid course id');
  }
}

let getCourses = function(req, res, publishedOnly) {
  const languageId = req.params.lan;
  let query = {'languagePair.to': languageId};
  if (publishedOnly) {
    query = {'languagePair.to': languageId, isPublished: true, isPublic: true}
  }
  Course.find(query, {}, function(err, courses) {
    response.handleError(err, res, 500, 'Error fetching courses', function(){
      response.handleSuccess(res, courses, 200, 'Fetched courses');
    });
  });
}

module.exports = {
  getLanCourses: function(req, res) {
    getCourses(req, res, false);
  },
  getPublicLanCourses: function(req, res) {
    getCourses(req, res, true);
  },
  getUserCourses: function(req, res) {
    // Get all courses that this user is currently learning
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id);
    // Find all courseIds for this user
    UserCourse.find({userId, subscribed: true}, {_id: 0, 'courseId': 1}, function(err, courseIds) {
      response.handleError(err, res, 500, 'Error fetching user courses', function(){
        const courseIdArr = [];
        courseIds.forEach(courseId => courseIdArr.push(courseId.courseId));
        const query = {_id: {$in: courseIdArr}};
        // Find courses with the courseIds
        Course.find(query, {},  function(err, courses) {
          response.handleError(err, res, 500, 'Error fetching user courses', function(){
            response.handleSuccess(res, courses, 200, 'Fetched user courses');
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
          userId = new mongoose.Types.ObjectId(req.decoded.user._id);

    Course.findOneAndUpdate(
      {_id: courseId, authorId: userId},
      {$set: {
        name: course.name,
        isPublic: course.isPublic,
        isPublished: course.isPublished
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating course', function(){
        response.handleSuccess(res, result, 200, 'Updated course');
      });
    });
  },
  updateCourseProperty: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          property = req.body,
          key = Object.keys(property)[0];

    if (key === 'isPublic' || key === 'isPublished') {
      Course.findOneAndUpdate(
        {_id: courseId, authorId: userId}, property, function(err, result) {
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
