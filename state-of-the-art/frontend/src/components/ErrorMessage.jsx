import React from 'react';

/**
 * Displays error messages to the user
 * Only renders when there's an actual message to display
 * 
 * @param {string} message - The error message to display
 */
function ErrorMessage({ message }) {
  // Don't render anything if there's no message
  if (!message) return null;
  
  // Style error messages in red for better visibility
  return (
    <p style={{ color: 'red', marginTop: '20px' }}>{message}</p>
  );
}

export default ErrorMessage;
