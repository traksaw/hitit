# 🎵 hit.it - Music Collaboration Platform

A full-stack web application for musicians to collaborate, remix, and share multi-track audio projects.

## 🏗️ Monorepo Structure

```
hit-it/
├── frontend/          SvelteKit + TypeScript
├── backend/           Express.js + MongoDB
└── package.json       Root scripts to run both
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Installation

```bash
# Install all dependencies (root + frontend + backend)
npm run install:all

# Or install manually
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Development

```bash
# Run both frontend and backend simultaneously
npm run dev

# Or run separately:
npm run dev:backend    # Express API on port 3000
npm run dev:frontend   # SvelteKit on port 5173
```

### Environment Variables

#### Backend (`backend/config/.env`):
```env
PORT=3000
DB_STRING=your_mongodb_connection_string
MONGODB_STRING=your_mongodb_connection_string
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
SESSION_SECRET=your_session_secret
```

#### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
```

## 📦 Tech Stack

### Frontend
- **Framework:** SvelteKit + TypeScript
- **Audio:** WaveSurfer.js
- **HTTP Client:** Axios
- **Real-time:** Socket.IO Client
- **Build:** Vite

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** Passport.js
- **File Storage:** Cloudinary
- **Security:** Helmet, express-rate-limit, express-validator

## 🎯 Features

- ✅ Audio file uploads with waveform visualization
- ✅ Multi-track jam creation
- ✅ Real-time collaboration
- ✅ User authentication
- ✅ Comment system
- ✅ Genre-based discovery
- ✅ Responsive design

## 📝 Available Scripts

```bash
npm run dev              # Run both frontend & backend
npm run dev:backend      # Run backend only
npm run dev:frontend     # Run frontend only
npm run install:all      # Install all dependencies
npm run build            # Build frontend for production
npm start                # Start backend in production
```

## 🌐 URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MongoDB: mongodb://localhost:27017 (or your MongoDB Atlas URL)

## 📖 Documentation

- [Frontend README](./frontend/README.md)
- [Backend API Docs](./backend/README.md) (coming soon)

## 🤝 Contributing

This is a learning project. Feel free to fork and experiment!

## 📄 License

ISC
