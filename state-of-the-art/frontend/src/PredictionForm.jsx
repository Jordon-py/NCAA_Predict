import React, { useState, useEffect } from 'react';
import { fetchConfig, submitPrediction } from './services/api';
import TrainModelSection from './components/TrainModelSection';
import FeatureInputForm from './components/FeatureInputForm';
import ErrorMessage from './components/ErrorMessage';
import PredictionReport from './components/PredictionReport';

/**
 * Main component that orchestrates the basketball prediction application
 * Manages state and coordinates between child components
 */
function PredictionForm() {
  const [featureColumns, setFeatureColumns] = useState([]);
  const [formData, setFormData] = useState({});
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  /**
   * Fetch configuration data when component mounts
   * Initializes form data based on the feature columns from the API
   */
  useEffect(() => {
    const getConfig = async () => {
      const data = await fetchConfig();
      setFeatureColumns(data.featureColumns);
      
      const initialData = {};
      data.featureColumns.forEach(col => { initialData[col] = ''; });
      setFormData(initialData);
    };
    
    getConfig();
  }, []);

  /**
   * Updates form data when user changes input values
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handles form submission and prediction requests
   * Updates UI state to show loading and results/errors
   */
  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setReport('');
    
    try {
      const data = await submitPrediction(formData);
      setReport(data.explanation);
    } catch (error) {
      console.error('Prediction error:', error);
      setErrorMsg(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>College Basketball Outcome Predictor</h1>
      
      {/* Train model section for initiating model training */}
      <TrainModelSection />
      
      {/* Feature input form for making predictions */}
      <FeatureInputForm 
        featureColumns={featureColumns}
        formData={formData}
        loading={loading}
        handleChange={handleChange}
        handleSubmit={handlePredict}
      />
      
      {/* Display error messages if any */}
      <ErrorMessage message={errorMsg} />
      
      {/* Display prediction results when available */}
      <PredictionReport report={report} />
    </div>
  );
}

export default PredictionForm;
