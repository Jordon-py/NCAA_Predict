#!/bin/zsh
# setup.sh – creates project folder structure, files, initializes Git, and pushes to GitHub.

echo "Creating project folder structure..."

# Create the directories
mkdir -p state-of-the-art/backend/data
mkdir -p state-of-the-art/frontend/public
mkdir -p state-of-the-art/frontend/src

# Move into the project folder
cd state-of-the-art

echo "Creating backend files..."

# Create backend/config.json with sample configuration
cat <<EOF > backend/config.json
{
  "datasetPath": "./data/dataset.csv",
  "featureColumns": [
    "team_stat1",
    "team_stat2",
    "player_performance",
    "injury_factor",
    "home_court_advantage"
  ],
  "labelColumn": "outcome"
}
EOF

# Create backend/index.js with our Express + TensorFlow.js code
cat <<'EOF' > backend/index.js
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
EOF

# Create backend/package.json
cat <<EOF > backend/package.json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@tensorflow/tfjs-node": "^4.0.0",
    "cors": "^2.8.5",
    "csv-parser": "^3.0.0",
    "dotenv": "^16.0.0",
    "express": "^4.17.1",
    "morgan": "^1.10.0"
  }
}
EOF

# Create an empty dataset file (to be populated later)
touch backend/data/dataset.csv

echo "Creating root-level Procfile and .gitignore..."

# Create Procfile
cat <<EOF > Procfile
web: node backend/index.js
EOF

# Create .gitignore
cat <<EOF > .gitignore
node_modules
backend/node_modules
frontend/node_modules
.env
EOF

echo "Creating Vite React project in frontend using the latest template..."

# Create Vite project for React in frontend (if not already created)
# This command will prompt you to install dependencies if necessary.
npm create vite@latest frontend --template react -- --force

# Change directory to frontend to update files
cd frontend

echo "Updating frontend/src/App.jsx..."

# Overwrite src/App.jsx with our content
cat <<'EOF' > src/App.jsx
import React from 'react';
import PredictionForm from './PredictionForm';

function App() {
  return (
    <div className="App">
      <PredictionForm />
    </div>
  );
}

export default App;
EOF

echo "Updating frontend/src/PredictionForm.jsx..."

# Overwrite src/PredictionForm.jsx with our content
cat <<'EOF' > src/PredictionForm.jsx
import React, { useState, useEffect } from 'react';

function PredictionForm() {
  const [featureColumns, setFeatureColumns] = useState([]);
  const [formData, setFormData] = useState({});
  const [report, setReport] = useState('');
  const [trainMsg, setTrainMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/config')
      .then((res) => res.json())
      .then((data) => {
        setFeatureColumns(data.featureColumns);
        const initialData = {};
        data.featureColumns.forEach(col => { initialData[col] = ''; });
        setFormData(initialData);
      })
      .catch((error) => {
        console.error('Error fetching config:', error);
        const defaultCols = ["team_stat1", "team_stat2", "player_performance", "injury_factor", "home_court_advantage"];
        setFeatureColumns(defaultCols);
        const initialData = {};
        defaultCols.forEach(col => { initialData[col] = ''; });
        setFormData(initialData);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setReport('');
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error');
      }
      const data = await response.json();
      setReport(data.explanation);
    } catch (error) {
      console.error('Prediction error:', error);
      setErrorMsg(error.message);
    }
    setLoading(false);
  };

  const handleTrain = async () => {
    setTrainLoading(true);
    setTrainMsg('');
    try {
      const response = await fetch('http://localhost:5000/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Training error');
      }
      const data = await response.json();
      setTrainMsg(data.message);
    } catch (error) {
      console.error('Training error:', error);
      setTrainMsg(error.message);
    }
    setTrainLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>College Basketball Outcome Predictor</h1>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleTrain} disabled={trainLoading} style={{ padding: '10px 20px', fontSize: '16px' }}>
          {trainLoading ? 'Training...' : 'Train Model'}
        </button>
        {trainMsg && <p style={{ color: 'green', marginTop: '10px' }}>{trainMsg}</p>}
      </div>
      <form onSubmit={handlePredict}>
        {featureColumns.map((col) => (
          <div key={col} style={{ marginBottom: '10px' }}>
            <label htmlFor={col} style={{ marginRight: '10px' }}>{col}:</label>
            <input
              type="number"
              step="any"
              id={col}
              name={col}
              value={formData[col] || ''}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '16px' }}>
          {loading ? 'Predicting...' : 'Predict Outcome'}
        </button>
      </form>
      {errorMsg && <p style={{ color: 'red', marginTop: '20px' }}>{errorMsg}</p>}
      {report && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h2>Prediction Report</h2>
          <p>{report}</p>
        </div>
      )}
    </div>
  );
}

export default PredictionForm;
EOF

echo "Installing frontend dependencies..."
npm install

# Return to root folder
cd ../..

echo "Initializing Git repository and making initial commit..."
git init
git add .
git commit -m "Initial commit of state-of-the-art project with Vite and Express"

echo "Enter your GitHub repository URL (or press Enter to skip adding remote):"
read githubRepo
if [ -n "$githubRepo" ]; then
  git remote add origin $githubRepo
  git branch -M main
  git push -u origin main
fi

echo "Setup complete! Your project is ready."
echo "Next steps:"
echo "1. To run the backend, navigate to state-of-the-art/backend and run 'npm install' then 'npm start'."
echo "2. To run the frontend in development, navigate to state-of-the-art/frontend and run 'npm install' then 'npm run dev'."
echo "3. For deployment, build the frontend (npm run build in frontend) and deploy to Heroku using your Procfile."
