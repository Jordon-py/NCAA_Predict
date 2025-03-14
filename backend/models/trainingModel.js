const mongoose = require('mongoose');

// Schema for trained models
const trainedModelSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  fromSeason: { 
    type: Number, 
    required: true 
  },
  toSeason: { 
    type: Number, 
    required: true 
  },
  features: { 
    type: [String], 
    required: true 
  },
  accuracy: { 
    type: Number, 
    required: true 
  },
  modelPath: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('TrainedModel', trainedModelSchema);
