const response = require('../response'),
      mongoose = require('mongoose'),
      access = require('./access'),
      Lesson = require('../models/lesson'),
      Course = require('../models/course').model;

function getCountPipeLine(courseId) {
  // Count exercises in lesson for overview
  const countQuery = {
          courseId,
          isDeleted: false
        },
        countPipeline = [
          {$match: countQuery},
          {$project: {
            words: {
              $filter: {
                input: '$exercises',
                as: 'words',
                cond: {$eq: ['$$words.tpe', 0]}
              }
            },
             exercises: 1
          }},
          {$group: {
            _id: '$_id',
            allcnt: {'$sum': {$size: '$exercises'}},
            wordcnt: {'$sum': {$size: '$words'}}
          }},
          {$project: {
            _id: 1,
            total: '$allcnt',
            totalwords: '$wordcnt'
          }}
        ];
  return countPipeline;
}

module.exports = {
  getCountPipeLine: function(courseId) {
    return getCountPipeLine(courseId)
  },
  getLessons: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.id),
          query = {
            courseId,
            isDeleted: false
          },
          options = {
            sort: {nr: 1}
          };
    Lesson.find(query, {}, options, function(err, lessons) {
      response.handleError(err, res, 400, 'Error fetching lessons', function(){
        response.handleSuccess(res, lessons);
      });
    });
  },
  getLessonHeaders: function(req, res) {
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          query = {
            courseId,
            isDeleted: false
          },
          projection = {
            name: 1,
            chapterName: 1,
            exerciseSteps: 1
          };
    Lesson.find(query, projection, function(err, lessons) {
      response.handleError(err, res, 400, 'Error fetching lesson headers', function(){
        response.handleSuccess(res, lessons);
      });
    });
  },
  getLesson: function(req, res) {
    if (mongoose.Types.ObjectId.isValid(req.params.lessonId)) {
      const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
            query = {_id: lessonId};
      Lesson.findOne(query, {}, function(err, lesson) {
        response.handleError(err, res, 400, 'Error fetching lesson', function(){
          response.handleSuccess(res, lesson);
        });
      });
    } else {
      //invalid id
      response.handleError(err, res, 404, 'Invalid lesson id');
    }
  },
  addLesson: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lesson = new Lesson(req.body),
          courseQuery = {
            _id: lesson.courseId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          };
    lesson._id = new mongoose.Types.ObjectId(); // Mongoose fails to create ID

    // First get access levels for course and add these to lesson
    Course.findOne(courseQuery, function(err, courseResult) {
      response.handleError(err, res, 400, 'Error getting course (adding lesson)', function(){
        if (courseResult) {
          lesson.access = courseResult.access;
          lesson.save(function(err, result) {
            response.handleError(err, res, 400, 'Error adding lesson', function(){
              response.handleSuccess(res, result);
            });
          });
        } else {
          err = 'Not authorized';
          response.handleError(err, res, 401, 'Not authorized to add lesson');
        }
      });
    });
  },
  removeLesson: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          query = {
            _id: lessonId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          },
          update = {$set: {
            isDeleted: true
          }};
    Lesson.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error removing lesson', function(){
        if (result) {
          response.handleSuccess(res, result);
        } else {
          err = 'Not authorized';
          response.handleError(err, res, 401, 'Not authorized to remove lesson');
        }
      });
    });
  },
  updateLessonHeader: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lesson = new Lesson(req.body),
          lessonId = new mongoose.Types.ObjectId(lesson._id),
          query = {
            _id: lessonId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          },
          update = {$set: {
            name: lesson.name,
            exerciseSteps: lesson.exerciseSteps,
            chapterName : lesson.chapterName,
            options: lesson.options
          }};
    Lesson.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error updating lesson header', function(){
        if (result) {
            response.handleSuccess(res, result);
        } else {
          err = 'Not authorized';
          response.handleError(err, res, 401, 'Not authorized to update lesson');
        }
      });
    });
  },
  updateIntro: function(req, res) {
    const intro = req.body.intro,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          query = {
            _id: lessonId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          },
          update = {$set: {
            intro: intro
          }};
    Lesson.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error updating lesson intro', function() {
        if (result) {
          response.handleSuccess(res, result);
        } else {
          err = 'Not authorized';
          response.handleError(err, res, 401, 'Not authorized to update lesson intro');
        }
      });
    });
  },
  getIntro: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          query = {_id: lessonId},
          projection = {_id: 0, intro: 1};
    Lesson.findOne(query, projection, function(err, data) {
      response.handleError(err, res, 400, 'Error fetching intro', function() {
        response.handleSuccess(res, data.intro);
      });
    });
  },
  getDialogue: function(req, res) {
    const lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          query = {_id: lessonId},
          projection = {_id: 0, dialogue: 1};
    Lesson.findOne(query, projection, function(err, data) {
      response.handleError(err, res, 400, 'Error fetching dialogue', function() {
        response.handleSuccess(res, data.dialogue);
      });
    });
  },
  updateDialogue: function(req, res) {
    const dialogue = req.body.dialogue,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lessonId = new mongoose.Types.ObjectId(req.params.lessonId),
          query = {
            _id: lessonId,
            access: access.checkAccess(userId, 3) // Must be at least editor
          },
          update = {$set: {
            dialogue: dialogue
          }};
    Lesson.findOneAndUpdate(query, update, function(err, result) {
      response.handleError(err, res, 400, 'Error updating lesson dialogue', function() {
        if (result) {
          response.handleSuccess(res, result);
        } else {
          err = 'Not authorized';
          response.handleError(err, res, 401, 'Not authorized to update lesson dialogue');
        }
      });
    });
  },
  getCountsByLesson: function(req, res) {
    // Count exercises in lesson for overview (demo only, logged in is from result.getResultsByLesson)
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          sort = {dt: -1, sequence: -1},
          countPipeline = getCountPipeLine(courseId);

    Lesson.aggregate(countPipeline, function(err, results) {
      response.handleError(err, res, 400, 'Error fetching exercises count per lesson', function(){
        response.handleSuccess(res, results);
      });
    });
  },
  checkWordPairExists: function(req, res) {
    // Check if an exercise with the wordpairId exists in the course
    const courseId = new mongoose.Types.ObjectId(req.params.courseId),
          wpId = req.params.wpId,
          wordLocal = req.params.wordLocal,
          wordForeign = req.params.wordForeign,
          wordQuery = {
            courseId,
            isDeleted: false,
            exercises: {$elemMatch: {
              'foreign.word': wordForeign,
              'local.word': wordLocal
            }}
          },
          wordProjection = {
            exercises: {$elemMatch: {
              'foreign.word': wordForeign,
              'local.word': wordLocal
            }}
          },
          idQuery = {
            courseId,
            isDeleted: false,
            'exercises.wordDetailId': wpId
          },
          idProjection = {
            exercises: {$elemMatch: {
              'wordDetailId': wpId
            }}
          };
    const getExercises = async () => {
      const idResult = wpId ? await Lesson.findOne(idQuery, idProjection) : null,
            wordResult = await Lesson.findOne(wordQuery, wordProjection)

      const idExercises = idResult ? idResult.exercises : [],
            wordExercises = wordResult ? wordResult.exercises : [];

      return {exercises: idExercises.concat(wordExercises)}
    }


    getExercises().then((results) => {
      response.handleSuccess(res, results.exercises);
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error fetching overview results');
    });
    /*
    Lesson.find(query, projection, function(err, result) {
      response.handleError(err, res, 400, 'Error checking exercises worpair exists in lesson', function(){
        const exercises = result.map(res => res.exercises[0]);
        response.handleSuccess(res, exercises);
      });
    });
    */
  }
}
