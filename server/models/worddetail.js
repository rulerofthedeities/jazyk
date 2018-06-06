const mongoose = require('mongoose'),
        Schema = mongoose.Schema;

const fileSchema = new Schema({s3:String, local:String}, {_id : false}),
      detailSchema = new Schema({
      lan: {type: String, required: true},
      word: {type: String, required: true, trim: true},
      docTpe: {type: String, default: 'details'},
      wordTpe: {type: String, required: true},
      region: String,
      article: String,
      case: String,
      followingCase: String,
      genus: String,
      plural: String,
      diminutive: { type: String, trim: true },
      comparative: { type: String, trim: true },
      superlative: { type: String, trim: true },
      aspect: String,
      aspectPair: String,
      motion: String,
      conjugation: { type: [String], default: void 0 },
      isDiminutive: Boolean,
      isPlural: Boolean,
      isIndeclinable: Boolean,
      isComparative: Boolean,
      isSuperlative: Boolean,
      images: { type: [fileSchema], default: void 0 },
      audios: { type: [fileSchema], default: void 0 },
      score: Number,
      wordCount: Number
  }, {collection: 'wordpairs'}
);

module.exports = {
  model: mongoose.model('Detail', detailSchema),
  schema: detailSchema // for multiple dbs
};