var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var lanSchema = new Schema({
  de: String,
  en: String,
  fr: String,
  nl: String
}, {_id : false});

var caseSchema = new Schema({code: String,value: String});

var lanConfigSchema = new Schema({
    _id: String,
    tpe: {type: String, required: true},
    code: {type: String, required: true},
    name: lanSchema,
    genera: [String],
    subjectPronouns: [String],
    aspects: [String],
    regions: [String],
    cases: [caseSchema]
  }, {collection: 'config'}
);

module.exports = mongoose.model('Config', lanConfigSchema);