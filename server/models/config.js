var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var caseSchema = new Schema({code: String,value: String});

var configSchema = new Schema({
    _id: String,
    tpe: {type: String, required: true},
    code: {type: String, required: true},
    name: String,
    genera: [String],
    subjectPronouns: [String],
    aspects: [String],
    regions: [String],
    cases: [caseSchema]
  }, {collection: 'config'}
);

configSchema.index({tpe: 1});
const configModel = mongoose.model('Config', configSchema);
configModel.ensureIndexes();

module.exports = configModel;
