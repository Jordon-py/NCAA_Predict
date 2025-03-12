// backend/index.js

require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const csv = require('csv-parser');
const tf = require('@tensorflow/tfjs-node');
const path = require('path');

const config = require('./config.json');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Global variables for training data and model
let trainingFeatures = null;
let trainingLabels = null;
let featureMeans = null;
let model = null;

async function loadDataset() {
  return new Promise((resolve, reject) => {
    const features = [];
    const labels = [];
    fs.createReadStream(process.env.DATASET_PATH || config.datasetPath)
      .pipe(csv())
      .on('data', (row) => {
        const featureRow = config.featureColumns.map(col => parseFloat(row[col]));
        features.push(featureRow);
        labels.push(parseFloat(row[config.labelColumn]));
      })
      .on('end', () => {
        console.log('Dataset loaded successfully.');
        resolve({ features, labels });
      })
      .on('error', (err) => {
        console.error('Error loading dataset:', err);
        reject(err);
      });
  });
}

function calculateFeatureMeans(features) {
  if (features.length === 0) return [];
  const numFeatures = features[0].length;
  const sums = new Array(numFeatures).fill(0);
  features.forEach(row => {
    row.forEach((val, idx) => sums[idx] += val);
  });
  return sums.map(sum => sum / features.length);
}

function buildModel(inputShape) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [inputShape], units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Binary classification
  model.compile({
    optimizer: tf.train.adam(),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });
  return model;
}

async function trainModel() {
  const { features, labels } = await loadDataset();
  trainingFeatures = tf.tensor2d(features);
  trainingLabels = tf.tensor2d(labels, [labels.length, 1]);
  featureMeans = calculateFeatureMeans(features);
  model = buildModel(features[0].length);
  console.log('Starting model training...');
  await model.fit(trainingFeatures, trainingLabels, {
    epochs: 50,
    batchSize: 16,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)}, accuracy=${logs.acc ? logs.acc.toFixed(4) : 'N/A'}`);
      }
    }
  });
  console.log('Model training complete.');
}

function generateExplanation(inputData, predictionProbability) {
  let explanation = `The model predicts a win probability of ${(predictionProbability * 100).toFixed(1)}%. `;
  config.featureColumns.forEach((col, idx) => {
    const inputVal = inputData[idx];
    const meanVal = featureMeans[idx];
    if (inputVal > meanVal) {
      explanation += `The value for ${col} (${inputVal}) is above the average (${meanVal.toFixed(2)}), supporting a positive outcome. `;
    } else {
      explanation += `The value for ${col} (${inputVal}) is below the average (${meanVal.toFixed(2)}), which may negatively impact the prediction. `;
    }
  });
  return explanation;
}

app.get('/config', (req, res) => {
  res.json({ featureColumns: config.featureColumns });
});

app.get('/status', (req, res) => {
  res.json({ modelTrained: model !== null });
});

app.post('/train', async (req, res) => {
  try {
    await trainModel();
    res.json({ message: 'Model training complete.' });
  } catch (error) {
    console.error('Training error:', error);
    res.status(500).json({ error: 'Training failed.' });
  }
});

app.post('/predict', async (req, res) => {
  try {
    if (!model) {
      return res.status(400).json({ error: 'Model is not trained yet. Please trigger /train first.' });
    }
    const inputData = [];
    for (let col of config.featureColumns) {
      const value = parseFloat(req.body[col]);
      if (isNaN(value)) {
        return res.status(400).json({ error: `Invalid or missing value for ${col}` });
      }
      inputData.push(value);
    }
    const inputTensor = tf.tensor2d([inputData]);
    const predictionTensor = model.predict(inputTensor);
    const predictionProbability = (await predictionTensor.data())[0];
    const predictedClass = predictionProbability >= 0.5 ? 1 : 0;
    const explanation = generateExplanation(inputData, predictionProbability);
    res.json({
      predictedClass,
      predictionProbability,
      explanation
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Prediction failed.' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
