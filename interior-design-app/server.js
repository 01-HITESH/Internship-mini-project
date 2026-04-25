'use strict';

const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const fs        = require('fs');
const path      = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// In production always set JWT_SECRET via environment variable.
const JWT_SECRET = process.env.JWT_SECRET || 'ds-interior-dev-secret-change-in-production';

const DATA_DIR  = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// ─── Bootstrap storage ───────────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, '[]', 'utf8');
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────
app.post('/api/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({
      error: 'Username must be 3–20 characters (letters, numbers, underscores).',
    });
  }

  // Simple structural email check (avoids backtracking-prone regex)
  const emailNorm = email.trim().toLowerCase();
  const atIdx = emailNorm.indexOf('@');
  if (atIdx < 1 || atIdx !== emailNorm.lastIndexOf('@') || emailNorm.length > 254 ||
      !emailNorm.slice(atIdx + 1).includes('.') || emailNorm.endsWith('.')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const users = readUsers();

  if (users.some(u => u.email === emailNorm)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }
  if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: username.trim(),
    email: emailNorm,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    message: 'Account created successfully.',
    token,
    user: { id: newUser.id, username: newUser.username, email: newUser.email },
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
app.post('/api/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const emailNorm = email.trim().toLowerCase();
  const users = readUsers();
  const user  = users.find(u => u.email === emailNorm);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Login successful.',
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

// ─── Verify token ─────────────────────────────────────────────────────────────
app.get('/api/verify', authLimiter, authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ─── SPA routes ───────────────────────────────────────────────────────────────
app.get('/home', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`DesignSpace running → http://localhost:${PORT}`);
});
