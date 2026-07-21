const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

function validateEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`\n✗ Missing required environment variables: ${missing.join(', ')}`);
    console.error('  Set them in server/.env or as environment variables.\n');
    process.exit(1);
  }

  const checks = [
    { key: 'MONGODB_URI', label: 'MongoDB URI' },
    { key: 'JWT_SECRET', label: 'JWT Secret' },
    { key: 'NODE_ENV', label: 'Node Environment', fallback: 'development' },
    { key: 'PORT', label: 'Server Port', fallback: '5000' },
    { key: 'EMAIL_HOST', label: 'Email Host', fallback: 'smtp.gmail.com' },
    { key: 'EMAIL_PORT', label: 'Email Port', fallback: '587' },
    { key: 'EMAIL_USER', label: 'Email User', fallback: '(not set)' },
    { key: 'EMAIL_PASS', label: 'Email Pass', fallback: '(not set)' },
    { key: 'JUDGE0_API_KEY', label: 'Judge0 API Key', fallback: '(not set)' },
    { key: 'JUDGE0_API_HOST', label: 'Judge0 API Host', fallback: 'judge0-ce.p.rapidapi.com' },
    { key: 'PISTON_API_URL', label: 'Piston API URL (fallback)', fallback: 'https://emkc.org/api/v2/piston' },
    { key: 'CLIENT_URL', label: 'Client URL', fallback: 'http://localhost:5173' },
  ];

  console.log('\n--- Environment Configuration ---');
  for (const { key, label, fallback } of checks) {
    const val = process.env[key] || fallback;
    const display = key.includes('SECRET') || key.includes('PASS') || key.includes('KEY')
      ? (process.env[key] ? '****' : fallback)
      : val;
    console.log(`  ✓ ${label}: ${display}`);
  }
  console.log('---------------------------------\n');
}

validateEnv();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/exam', require('./routes/examRoutes'));
app.use('/api/security', require('./routes/securityRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/colleges', require('./routes/collegeRoutes'));
app.use('/api/code', require('./routes/codeRoutes'));
app.use('/api/auth', require('./routes/passwordResetRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});

module.exports = app;
