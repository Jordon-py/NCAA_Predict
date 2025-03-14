
import React from 'react';

/**
 * Displays prediction results in a formatted box
 * Only renders when there are prediction results to show
 * 
 * @param {string} report - The prediction report text to display
 */
function PredictionReport({ report }) {
  // Conditionally render only when there's a report to show
  if (!report) return null;
  
  // Use a bordered container to make the report stand out visually
    return (
    <>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap');
        <div style={{ marginTop: '20px', padding: '15px', fontFamily: "'Montserrat', sans-serif", border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Prediction Report</h2>
            <p>{report}</p>
        </div>
    </>
  );
}

export default PredictionReport;
