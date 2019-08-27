'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var dateSchema = new Schema({
  dtSubscribed: {type: Date, default: Date.now},
  dtLastReSubscribed: Date,
  dtLastUnSubscribed: Date
}, {_id : false});

var bookmarkSchema = new Schema({
  chapterId: {type: Schema.Types.ObjectId},
  chapterSequence: {type: Number, required: true},
  sentenceNrChapter: {type: Number, required: true},
  isChapterRead: {type: Boolean, default: false},
  isBookRead: {type: Boolean, default: false},
  lastGlossaryType: String,
  dt: {type: Date, default: new Date()}
}, {_id : false});

var userBookSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  userId: {type: Schema.Types.ObjectId, required: true},
  bookType: {type: String, required: true},
  isTest: {type: Boolean, required: true},
  lanCode: {type: String, required: true},
  subscribed: {type: Boolean, default: true},
  recommended: Boolean,
  bookmark: bookmarkSchema,
  dt: {type: dateSchema, required: true},
  repeats: [Date],
  repeatCount: Number
});

userBookSchema.index({userId: 1, bookId: 1, lanCode: 1, bookType: 1, isTest: 1});
const UserBookModel = mongoose.model('UserBook', userBookSchema);
UserBookModel.ensureIndexes();

var userBookThumbSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, required: true},
  bookId: {type: Schema.Types.ObjectId, required: true},
  translatorId: {type: Schema.Types.ObjectId, required: true},
  translationId: {type: Schema.Types.ObjectId, required: true},
  translationElementId: {type: Schema.Types.ObjectId, required: true},
  up: {type: Boolean, required: true},
  isOwnTranslation: {type: Boolean, required: true}
});

userBookThumbSchema.index({userId: 1, bookId: 1, translationId: 1, translationElementId: 1}, {unique: true});
userBookThumbSchema.index({translatorId: 1, isOwnTranslation: 1});
const UserBookThumbModel = mongoose.model('UserBookThumb', userBookThumbSchema);
UserBookThumbModel.ensureIndexes();

var trophySchema = new Schema({
  userId: {type: Schema.Types.ObjectId, required: true},
  trophy: {type: String, required: true},
  created: {type: Date, default: new Date()}
});

trophySchema.index({userId: 1, trophy: 1}, {unique: true});
const trophyModel = mongoose.model('UserTrophy', trophySchema);
trophyModel.ensureIndexes();

module.exports = {
  userBook: UserBookModel,
  userBookThumb: UserBookThumbModel,
  userTrophy: trophyModel
};

