import React from 'react';
import ModelTrainingForm from '../components/ModelTrainingForm';
import '../styles/ModelTrainingForm.css';

const TrainingPage = () => {
  return (
    <div className="training-page">
      <h1>NCAA Basketball Model Training</h1>
      <p>
        Use the form below to train a prediction model based on historical NCAA basketball data.
        Select your desired season range and features to customize the model.
      </p>
      
      <ModelTrainingForm />
    </div>
  );
};

export default TrainingPage;
