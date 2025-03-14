import React, { useState } from 'react';
import { trainModel } from '../services/api';

/**
 * Component for initiating model training
 * Displays training status and feedback to the user
 */
function TrainModelSection() {
  const [trainMsg, setTrainMsg] = useState('');
  const [trainLoading, setTrainLoading] = useState(false);

  /**
   * Handles the train button click
   * Shows loading state and displays success/error message
   */
  const handleTrain = async () => {
    setTrainLoading(true);
    setTrainMsg('');
    try {
      const data = await trainModel();
      setTrainMsg(data.message);
    } catch (error) {
      console.error('Training error:', error);
      setTrainMsg(error.message);
    }
    setTrainLoading(false);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <button 
        onClick={handleTrain} 
        disabled={trainLoading} 
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        {trainLoading ? 'Training...' : 'Train Model'}
      </button>
      {trainMsg && <p style={{ color: 'green', marginTop: '10px' }}>{trainMsg}</p>}
    </div>
  );
}

export default TrainModelSection;
