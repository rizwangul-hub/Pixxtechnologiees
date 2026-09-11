// Backend/api/index.js
// Vercel serverless entry point — forwards ALL requests to the Express app

const app = require('../src/app');

module.exports = app;
