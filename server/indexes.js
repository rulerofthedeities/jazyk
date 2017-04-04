var mongo = require('mongodb');
let indexSpecs = [];
indexSpecs['answers'] = [
  {
    key: {userId:1, wordId:1},
    unique:true,
    background:true
  },
  {
    key: {userId:1, correct:1},
    background:true
  }
];

indexSpecs['wordpairs'] = [
  {
    key:{level:1, tpe:1},
    background:true
  }
];

indexSpecs['progress'] = [
  {
    key:{userId:1, dt:1},
    unique:true,
    background:true
  }
];

module.exports = {
  create: function(cb) {
    console.log('Creating indexes');
    /*mongo.DB.collection('answers').createIndexes(indexSpecs['answers'], 
      mongo.DB.collection('wordpairs').createIndexes(indexSpecs['wordpairs'],
        mongo.DB.collection('progress').createIndexes(indexSpecs['progress'], cb()))
    );
    */
    cb()
  }
};
