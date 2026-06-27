# Visitor Induction & Token Generation Kiosk (VMS)

A touchscreen-based visitor check-in system for company reception areas. Visitors complete a safety induction video, capture a selfie, enter details, and receive a daily token — all in under one minute.

## Features

### Kiosk (Visitor Flow)
- Welcome screen with large touch-friendly Start button
- Fullscreen safety induction video (skipping disabled)
- Webcam selfie capture with retake support
- Visitor registration form with validation
- Daily running token generation (001, 002, 003… resets at midnight)
- Success screen with print support and 10-second auto-return

### Admin Dashboard
- Secure JWT authentication
- Dashboard stats (today, this month, last token)
- Visitor search (name, mobile, token) and date filter
- Export to Excel and PDF
- Configure induction video via URL or file upload

## Tech Stack

| Layer    | Technologies                          |
|----------|---------------------------------------|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend  | Node.js, Express, MongoDB, Mongoose   |
| Storage  | Local filesystem (dev) / AWS S3 (prod) |

## Prerequisites

- **Node.js** 18+
- **MongoDB** 6+ (local or Atlas)
- Kiosk device with camera (for production)

## Quick Start

### 1. Clone and install

```bash
cd vms

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Install all dependencies (root + backend + frontend)
npm install
```

### 2. Configure environment

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vms
JWT_SECRET=change-this-to-a-long-random-string
STORAGE_TYPE=local
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123
```

Edit `frontend/.env` (optional — defaults work with Vite proxy):

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed admin user

```bash
cd backend
npm run seed
```

### 4. Start the app

From the project root:

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 5173) in one terminal.

### 5. Open the app

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Kiosk (visitor check-in) |
| http://localhost:5173/admin/login | Admin dashboard |

**Default admin credentials:** `admin@company.com` / `admin123`

## Project Structure

```
vms/
├── backend/
│   ├── src/
│   │   ├── config/       # DB & S3 configuration
│   │   ├── middleware/   # Auth, upload, error handling
│   │   ├── models/       # Visitor, Counter, Settings, Admin
│   │   ├── routes/       # REST API routes
│   │   ├── services/     # Token generation, exports
│   │   ├── scripts/      # Admin seed script
│   │   └── server.js
│   └── uploads/          # Local photo storage (dev)
└── frontend/
    └── src/
        ├── api/            # Axios API clients
        ├── components/     # Shared UI components
        ├── context/        # Theme & kiosk state
        ├── hooks/          # Camera, toast hooks
        └── pages/
            ├── kiosk/      # Visitor flow screens
            └── admin/      # Admin dashboard
```

## API Endpoints

### Public (Kiosk)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kiosk/settings/video` | Get induction video URL |
| POST | `/api/kiosk/register` | Register visitor (multipart) |
| GET | `/api/kiosk/today-count` | Today's visitor count |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |

### Admin (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/visitors` | List visitors (search/filter) |
| GET | `/api/admin/export/excel` | Export Excel report |
| GET | `/api/admin/export/pdf` | Export PDF report |
| GET/PUT | `/api/settings/video` | Manage induction video |

## Token Logic

Tokens are generated per calendar day:
1. On registration, the system checks today's date
2. A counter document is incremented atomically
3. Token is formatted as `001`, `002`, etc.
4. At midnight (new date), a new counter starts at `001`

## Production Deployment

### AWS S3 Photo Storage

Set in `backend/.env`:

```env
STORAGE_TYPE=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=your-bucket
```

### Build Frontend

```bash
cd frontend
npm run build
```

Serve the `dist/` folder via nginx or any static host. Point `VITE_API_URL` to your production API.

### Kiosk Mode

- Open http://your-kiosk-url in Chrome/Edge
- Press F11 for fullscreen, or the app requests fullscreen on first tap
- Disable browser navigation shortcuts via OS kiosk shell (e.g. Windows Assigned Access)

## License

MIT
