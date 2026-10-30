'use strict';

const { parentPort, workerData } = require('node:worker_threads');
const { scanPath } = require('./scanner-service.cjs');

try {
  const dataset = scanPath(workerData.rootPath, {
    onProgress(progress) {
      parentPort.postMessage({ type: 'progress', progress });
    }
  });
  parentPort.postMessage({ type: 'result', dataset });
} catch (error) {
  parentPort.postMessage({
    type: 'error',
    error: {
      message: error && error.message ? error.message : String(error),
      code: error && error.code ? error.code : null
    }
  });
}
