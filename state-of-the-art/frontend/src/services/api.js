// API base URL - could be moved to environment variable for different environments
const API_URL = 'http://localhost:5000';

/**
 * Fetches feature configuration from the backend
 * Returns default columns if the API call fails to ensure app functionality
 */
export const fetchConfig = async () => {
  try {
    const response = await fetch(`${API_URL}/config`);
    if (!response.ok) throw new Error('Failed to fetch configuration');
    return await response.json();
  } catch (error) {
    console.error('Error fetching config:', error);
    // Return default columns if the API call fails
    return { 
      featureColumns: ["team_stat1", "team_stat2", "player_performance", "injury_factor", "home_court_advantage"] 
    };
  }
};

/**
 * Submits form data to the prediction endpoint and handles response
 * Throws meaningful errors for better user experience
 */
export const submitPrediction = async (formData) => {
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Server error');
  }
  
  return await response.json();
};

/**
 * Triggers model training on the backend
 * Returns a message about training success or failure
 */
export const trainModel = async () => {
  const response = await fetch(`${API_URL}/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Training error');
  }
  
  return await response.json();
};
