const response = require('../response'),
      mongoose = require('mongoose'),
      Course = require('../models/course'),
      UserCourse = require('../models/usercourse');

let getCourse = function(req, res, authorOnly) {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
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

module.exports = {
  getLanCourses: function(req, res) {
    const languageId = req.params.lan;
    Course.find({'languagePair.to': languageId}, {}, function(err, courses) {
      response.handleError(err, res, 500, 'Error fetching courses', function(){
        response.handleSuccess(res, courses, 200, 'Fetched courses');
      });
    });
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
  addCourse: function(req, res) {
    const course = new Course(req.body);
    course._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID

    course.save(function(err, result) {
      response.handleError(err, res, 500, 'Error adding course', function(){
        response.handleSuccess(res, result, 200, 'Added course');
      });
    });
  },
  updateCourseHeader: function(req, res) {
    const course = new Course(req.body);
    const courseId = new mongoose.Types.ObjectId(course._id);

    Course.findOneAndUpdate(
      {_id: courseId},
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
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const property = req.body;
    const key = Object.keys(property)[0];
    if (key === 'isPublic' || key === 'isPublished') {
      Course.findOneAndUpdate(
        {_id: courseId}, property, function(err, result) {
        response.handleError(err, res, 500, 'Error updating ' + key, function(){
          response.handleSuccess(res, result, 200, 'Updated ' + key);
        });
      });
    }
  },
  updateCourseLesson: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const lesson = req.body;
    const upd = {
      $addToSet: { 'lessons.$.lessonIds': lesson.lessonId}
    };

    Course.findOneAndUpdate(
      {_id: courseId, 'lessons.chapter': lesson.chapterName}, upd, function(err, result) {
      response.handleError(err, res, 500, 'Error updating course lesson', function(){
        response.handleSuccess(res, result, 200, 'Updated course lesson');
      });
    });
  },
  addChapter: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const chapter = req.body;

    Course.findOneAndUpdate(
      {_id: courseId},
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
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const chapter = req.body.name;

    Course.findOneAndUpdate(
      {_id: courseId},
      { $pull: { chapters: chapter }}, function(err, result) {
      response.handleError(err, res, 500, 'Error removing chapter "' + chapter+ '"', function(){
        response.handleSuccess(res, result, 200, 'Removed chapter "' + chapter+ '"');
      });
    });
  },
  updateChapters: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const chapters = req.body;

    Course.findOneAndUpdate(
      {_id: courseId},
      {$set: {
        chapters: chapters
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating chapters', function(){
        response.handleSuccess(res, result, 200, 'Updated chapters');
      });
    });
  },
  updateLessonIds: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const lessonIds = req.body;
    console.log('updating course', courseId, lessonIds);

    Course.findOneAndUpdate(
      {_id: courseId},
      {$set: {
        lessons: lessonIds
      }}, function(err, result) {
      response.handleError(err, res, 500, 'Error updating lesson Ids', function(){
        response.handleSuccess(res, result, 200, 'Updated lesson Ids');
      });
    });
  }
}
