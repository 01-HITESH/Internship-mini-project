# DesignSpace – 3D Interior Design Platform

A full-stack web application with an **immersive Three.js 3D login/registration experience** and a feature-rich **interior design homepage**, built with Node.js, Express, JWT authentication, and bcrypt password hashing.

---

## ✨ Features

### Login / Register Page
- **Immersive 3D scene** – A fully-rendered interior room (sofa, coffee table, floor lamp, bookshelf, plant, wall art, floating dust particles) orbits slowly in the background using **Three.js r150**.
- **Glassmorphism form** – Login and registration forms float over the 3D scene with a `backdrop-filter` glass card effect.
- **Animated transitions** – Smooth fade/slide between login and register modes.
- **Client-side validation** – Instant field feedback before any network request.

### Interior Design Homepage (protected)
- **Hero 3D scene** – A second, brighter Three.js room fills the hero section.
- **Room categories** – Six room-type cards (Living Room, Bedroom, Kitchen, Bathroom, Home Office, Dining Room) with hover overlays.
- **Design styles** – Six aesthetic style cards (Modern, Scandinavian, Industrial, Bohemian, Traditional, Minimalist).
- **Interactive 3D Room Planner** – Real-time room customisation:
  - **Theme presets**: Modern, Cozy, Scandinavian, Industrial – updates all materials at once.
  - **Wall colour swatches** – Six colour options applied live to the 3D scene.
  - **Floor style** – Wood, Marble, Carpet, Concrete – updates floor material live.
  - **Save Design** button with animated confirmation.
- **Featured Designs** – Six curated design inspiration cards.
- **Responsive** – Full mobile/tablet/desktop support.

### Backend (Node.js / Express)
| Endpoint | Method | Description |
|---|---|---|
| `/api/register` | POST | Create account (username, email, bcrypt-hashed password) |
| `/api/login` | POST | Authenticate and receive JWT |
| `/api/verify` | GET | Validate a Bearer token |
| `/home` | GET | Serve the homepage HTML |
| `*` | GET | Serve the login page HTML |

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (12 salt rounds).
- Auth tokens are **JWT** (24 h expiry); stored in `localStorage`.
- Input validated (regex + length checks) on both client and server.
- Token verified server-side on every protected API call.
- **Production note**: set a strong `JWT_SECRET` environment variable and serve over HTTPS.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js ≥ 16**

### Install & Run
```bash
cd interior-design-app
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

For development with auto-reload:
```bash
npm run dev   # requires nodemon (installed as devDependency)
```

### Environment Variables
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `JWT_SECRET` | *(insecure default)* | Secret key for signing JWTs – **always override in production** |

---

## 📁 Project Structure

```
interior-design-app/
├── server.js          ← Express API + static file server
├── package.json
├── data/
│   └── users.json     ← Persisted user accounts (auto-created)
└── public/
    ├── index.html     ← Login / Register page
    ├── home.html      ← Interior design homepage
    ├── css/
    │   ├── login.css
    │   └── home.css
    └── js/
        ├── scene.js   ← Three.js 3D scene (login background)
        ├── auth.js    ← Login / register form logic
        └── home.js    ← Homepage auth check + 3D scenes + interactions
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend 3D | Three.js r150 (CDN) |
| Frontend UI | Vanilla HTML / CSS / JS |
| Backend | Node.js + Express 4 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Storage | JSON flat-file (`data/users.json`) |
