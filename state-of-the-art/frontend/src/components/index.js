/**
 * Barrel file that exports all components from a central location
 * Makes imports cleaner in parent components
 */

/**
 * Using named exports allows for selective imports
 * Simplifies imports when using multiple components
 */
export { default as TrainModelSection } from './TrainModelSection';
export { default as FeatureInputForm } from './FeatureInputForm';
export { default as ErrorMessage } from './ErrorMessage';
export { default as PredictionReport } from './PredictionReport';
