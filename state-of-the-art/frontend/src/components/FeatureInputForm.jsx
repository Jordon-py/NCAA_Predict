import React from 'react';

/**
 * Renders form inputs dynamically based on the feature columns
 * Handles form submission for prediction requests
 * 
 * @param {string[]} featureColumns - Array of feature names to render as inputs
 * @param {object} formData - Current form values
 * @param {boolean} loading - Whether a prediction request is in progress
 * @param {function} handleChange - Handler for input value changes
 * @param {function} handleSubmit - Form submission handler
 */
function FeatureInputForm({ 
  featureColumns, 
  formData, 
  loading, 
  handleChange, 
  handleSubmit 
}) {
  return (
    <form onSubmit={handleSubmit}>
      {/* Dynamically generate form inputs based on the feature columns from the API */}
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
      {/* Submit button shows loading state during prediction */}
      <button 
        type="submit" 
        disabled={loading} 
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        {loading ? 'Predicting...' : 'Predict Outcome'}
      </button>
    </form>
  );
}

export default FeatureInputForm;
