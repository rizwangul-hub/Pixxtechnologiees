const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
// unitRoutes removed - aliased to propertyRoutes for backward compatibility
const customerRoutes = require('./routes/customerRoutes');
const agreementRoutes = require('./routes/agreementRoutes');
const tenancyRoutes = require('./routes/tenancyRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const exportRoutes = require('./routes/exportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const landlordRoutes = require('./routes/landlordRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const tenantDocumentRoutes = require('./routes/tenantDocumentRoutes');
const agentRoutes = require('./routes/agentRoutes');
const agentPaymentRoutes = require('./routes/agentPaymentRoutes');
const agentExpenseRoutes = require('./routes/agentExpenseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const mortgageRoutes = require('./routes/mortgageRoutes');
const errorHandler = require('./middleware/errorHandler');

app.set('trust proxy', 1); // Trust Vercel edge proxy for correct client IP handling
// Disable client-side caching for API endpoints
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  next();
});

// Security HTTP Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  // Production frontend URL — set FRONTEND_URL in Vercel env vars
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow any *.vercel.app subdomain (covers preview deployments)
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Allow localhost in development
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      // Check explicit allowlist
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`), false);
    },
    credentials: true,
  })
);

const connectDB = require('./config/db');

// Ensure Database is Connected for Serverless Requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB Middleware Error]', err.message);
    return res.status(500).json({
      success: false,
      message: `Database connection failed: ${err.message}. Please verify MONGODB_URI on Vercel Dashboard and ensure 0.0.0.0/0 is allowed in MongoDB Atlas Network Access.`,
    });
  }
});

// Body Parsing Middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize MongoDB Operator Injection ($ and .)
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // 2000 requests per 15 mins per IP
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadExportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 upload/export operations per 15 mins
  message: { success: false, message: 'Too many upload or export requests from this IP. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login requests from this IP, please try again later.' },
});

app.use('/api/', globalLimiter);
app.use('/api/upload', uploadExportLimiter);
app.use('/api/export', uploadExportLimiter);

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/landlords', landlordRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/units', propertyRoutes); // Backward compatibility alias
app.use('/api/customers', customerRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/tenancies', tenancyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/mortgages', mortgageRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/agent-payments', agentPaymentRoutes);
app.use('/api/agent-expenses', agentExpenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', tenantDocumentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    company: 'PixxTechnologies',
    status: 'Backend operational',
    timestamp: new Date().toISOString(),
  });
});

// Root API Welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    company: 'PixxTechnologies',
    message: 'Welcome to PixxTechnologies Property Management API System',
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
