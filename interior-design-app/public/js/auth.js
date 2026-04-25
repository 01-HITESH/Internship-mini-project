'use strict';

const TOKEN_KEY = 'ds_token';
const USER_KEY  = 'ds_user';

// ─── Redirect if already authenticated ───────────────────────────────────────
(function checkExistingSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  fetch('/api/verify', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => { if (res.ok) window.location.href = '/home'; })
    .catch(() => { /* ignore network errors */ });
}());

// ─── Element refs ────────────────────────────────────────────────────────────
const loginForm      = document.getElementById('login-form');
const registerForm   = document.getElementById('register-form');
const showRegisterEl = document.getElementById('show-register');
const showLoginEl    = document.getElementById('show-login');
const loginError     = document.getElementById('login-error');
const registerError  = document.getElementById('register-error');
const registerOK     = document.getElementById('register-success');

// ─── Form toggling ───────────────────────────────────────────────────────────
showRegisterEl.addEventListener('click', e => {
  e.preventDefault();
  loginForm.classList.remove('active');
  registerForm.classList.add('active');
  clearFeedback();
});

showLoginEl.addEventListener('click', e => {
  e.preventDefault();
  registerForm.classList.remove('active');
  loginForm.classList.add('active');
  clearFeedback();
});

function clearFeedback() {
  loginError.textContent    = '';
  registerError.textContent = '';
  registerOK.textContent    = '';
}

// ─── Button loading state ────────────────────────────────────────────────────
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('span').style.opacity  = loading ? '0' : '1';
  btn.querySelector('.spinner').classList.toggle('hidden', !loading);
}

// ─── Fade out overlay, then redirect ─────────────────────────────────────────
function redirectHome() {
  const overlay = document.getElementById('overlay');
  overlay.style.opacity = '0';
  setTimeout(() => { window.location.href = '/home'; }, 480);
}

// ─── Login submission ────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginError.textContent = '';

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');

  if (!email || !password) {
    loginError.textContent = 'Please fill in all fields.';
    return;
  }

  setLoading(btn, true);
  try {
    const res  = await fetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      loginError.textContent = data.error || 'Login failed. Please try again.';
      return;
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
    redirectHome();
  } catch {
    loginError.textContent = 'Connection error. Please check your network.';
  } finally {
    setLoading(btn, false);
  }
});

// ─── Register submission ──────────────────────────────────────────────────────
registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  registerError.textContent = '';
  registerOK.textContent    = '';

  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  const btn      = document.getElementById('register-btn');

  if (!username || !email || !password || !confirm) {
    registerError.textContent = 'Please fill in all fields.';
    return;
  }
  if (password !== confirm) {
    registerError.textContent = 'Passwords do not match.';
    return;
  }
  if (password.length < 6) {
    registerError.textContent = 'Password must be at least 6 characters.';
    return;
  }

  setLoading(btn, true);
  try {
    const res  = await fetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      registerError.textContent = data.error || 'Registration failed. Please try again.';
      return;
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
    registerOK.textContent = '✓ Account created! Redirecting…';
    setTimeout(redirectHome, 900);
  } catch {
    registerError.textContent = 'Connection error. Please check your network.';
  } finally {
    setLoading(btn, false);
  }
});
