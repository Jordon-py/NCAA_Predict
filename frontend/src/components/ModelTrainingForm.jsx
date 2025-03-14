import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModelTrainingForm = () => {
  const [fromSeason, setFromSeason] = useState(2010);
  const [toSeason, setToSeason] = useState(2023);
  const [numFeatures, setNumFeatures] = useState(5);
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch available features on component mount
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await axios.get('/api/features');
        setAvailableFeatures(response.data);
      } catch (error) {
        console.error('Error fetching features:', error);
      }
    };

    fetchFeatures();
  }, []);

  const handleNumFeaturesChange = (e) => {
    const value = parseInt(e.target.value);
    setNumFeatures(value);
    // Truncate selected features if needed
    if (selectedFeatures.length > value) {
      setSelectedFeatures(selectedFeatures.slice(0, value));
    }
  };

  const handleFeatureSelect = (feature) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else if (selectedFeatures.length < numFeatures) {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFeatures.length !== numFeatures) {
      setMessage(`Please select exactly ${numFeatures} features`);
      return;
    }

    setIsLoading(true);
    setMessage('Training model...');

    try {
      const response = await axios.post('/api/train-model', {
        fromSeason,
        toSeason,
        features: selectedFeatures,
      });
      setMessage(`Model trained successfully! Accuracy: ${response.data.accuracy}`);
    } catch (error) {
      setMessage(`Error training model: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="model-training-form">
      <h2>Train NCAA Prediction Model</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Season Range:</label>
          <div className="season-range">
            <div>
              <label>From:</label>
              <input
                type="number"
                min="1985"
                max={toSeason}
                value={fromSeason}
                onChange={(e) => setFromSeason(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label>To:</label>
              <input
                type="number"
                min={fromSeason}
                max="2023"
                value={toSeason}
                onChange={(e) => setToSeason(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Number of Features:</label>
          <input
            type="number"
            min="1"
            max={availableFeatures.length}
            value={numFeatures}
            onChange={handleNumFeaturesChange}
          />
        </div>

        <div className="form-group">
          <label>Select Features ({selectedFeatures.length}/{numFeatures}):</label>
          <div className="feature-selection">
            {availableFeatures.map((feature) => (
              <div key={feature} className="feature-option">
                <input
                  type="checkbox"
                  id={feature}
                  checked={selectedFeatures.includes(feature)}
                  onChange={() => handleFeatureSelect(feature)}
                  disabled={!selectedFeatures.includes(feature) && selectedFeatures.length >= numFeatures}
                />
                <label htmlFor={feature}>{feature}</label>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isLoading || selectedFeatures.length !== numFeatures}>
          {isLoading ? 'Training...' : 'Train Model'}
        </button>
      </form>

      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default ModelTrainingForm;
