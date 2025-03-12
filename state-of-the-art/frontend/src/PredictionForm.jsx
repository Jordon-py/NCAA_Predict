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
