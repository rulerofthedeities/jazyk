var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var dateSchema = new Schema({
  dtSubscribed: {type: Date, default: Date.now},
  dtLastReSubscribed: Date,
  dtLastUnSubscribed: Date
}, {_id : false});

var bookmarkSchema = new Schema({
  chapterId: {type: Schema.Types.ObjectId, required: true},
  sentenceNrChapter: {type: Number, required: true},
  isChapterRead: {type: Boolean, default: true},
  isBookRead: {type: Boolean, default: false},
  dt: {type: Date, default: new Date()}
}, {_id : false});

var userBookSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  userId: {type: Schema.Types.ObjectId, required: true},
  lanCode: {type: String, required: true},
  subscribed: {type: Boolean, default: true},
  bookmark: bookmarkSchema,
  dt: {type: dateSchema, required: true}
});

userBookSchema.index({userId: 1, bookId: 1, lanCode: 1});
const UserBookModel = mongoose.model('UserBook', userBookSchema);
UserBookModel.ensureIndexes();

var userBookThumbSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, required: true},
  bookId: {type: Schema.Types.ObjectId, required: true},
  translationId: {type: Schema.Types.ObjectId, required: true},
  translationElementId: {type: Schema.Types.ObjectId, required: true},
  up: {type: Boolean, required: true}
});

userBookThumbSchema.index({userId: 1, bookId: 1, translationId: 1, translationElementId: 1}, {unique: true});
const UserBookThumbModel = mongoose.model('UserBookThumb', userBookThumbSchema);
UserBookThumbModel.ensureIndexes();

module.exports = {
  userBook: UserBookModel,
  UserBookThumb: UserBookThumbModel
};

