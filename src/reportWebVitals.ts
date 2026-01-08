import { ReportHandler } from 'web-vitals';

// Return the dynamic import Promise so callers/tests can await completion
const reportWebVitals = (onPerfEntry?: ReportHandler): Promise<void> | void => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    return import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
