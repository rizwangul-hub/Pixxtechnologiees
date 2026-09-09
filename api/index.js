try {
  require('pdfkit/js/standard-fonts/Helvetica.cjs');
  require('pdfkit/js/standard-fonts/Helvetica-Bold.cjs');
  require('pdfkit/js/standard-fonts/Helvetica-Oblique.cjs');
  require('pdfkit/js/standard-fonts/Helvetica-BoldOblique.cjs');
} catch (e) {}

const app = require('../Backend/src/app');
const connectDB = require('../Backend/src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel DB Connection Error]', err.message);
  }
  return app(req, res);
};
