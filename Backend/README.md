# MediSync AI – Backend API

Intelligent Integrated Hospital Management and Healthcare Assistance System – Backend Service.

## Overview
This backend service provides the foundational architecture, MongoDB Atlas connectivity, role-based access control (RBAC), and JWT-based authentication for MediSync AI.

## Technology Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB Atlas via Mongoose
- **Authentication**: JSON Web Tokens (`jsonwebtoken`)
- **Security & Hashing**: `bcryptjs` (salt rounds: 10)
- **CORS & Config**: `cors`, `dotenv`

---

## Folder Structure
```
Backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas Mongoose connection
│   ├── controllers/
│   │   └── authController.js     # Auth logic: register, login, getMe, logout
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT Bearer token authentication
│   │   ├── roleMiddleware.js     # Role-based access control (RBAC)
│   │   └── errorMiddleware.js    # Centralized error and 404 handler
│   ├── models/
│   │   └── User.js               # Mongoose User model with 6 roles
│   ├── routes/
│   │   └── authRoutes.js         # /api/auth endpoints
│   ├── utils/
│   │   └── generateToken.js      # JWT signing utility
│   ├── app.js                    # Express app configuration & middleware
│   └── server.js                 # Server bootstrap with DB connection
├── .env.example                  # Environment variables template
├── .gitignore                    # Secrets and node_modules exclusions
├── package.json                  # Backend dependencies and scripts
├── seed.js                       # Development database seeder
└── README.md
```

---

## Six System Roles
The backend defines six canonical system roles:
1. `admin` (Administrator)
2. `doctor` (Doctor / Physician)
3. `nurse` (Head Nurse / Clinical Nurse)
4. `receptionist` (Receptionist / Front Desk)
5. `pharmacist` (Chief Pharmacist)
6. `patient` (Patient)

---

## Environment Variables
Create a `.env` file in the `Backend/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd Backend
   npm install
   ```

2. **Seed Development Users**:
   Populate MongoDB Atlas with development accounts for each role:
   ```bash
   node seed.js
   ```

3. **Start in Development Mode**:
   ```bash
   npm run dev
   ```

4. **Start in Production Mode**:
   ```bash
   npm start
   ```

---

## Default Development Accounts
All seeded accounts use the development password: **`MediSync@123`**

| Role | Canonical Email | Demo Email Alias |
|---|---|---|
| **Admin** | `admin@medisync.local` | `admin@medisync.com` |
| **Doctor** | `doctor@medisync.local` | `arun.kumar@medisync.com`, `doctor@medisync.com` |
| **Nurse** | `nurse@medisync.local` | `anitha@medisync.com`, `nurse@medisync.com` |
| **Receptionist** | `receptionist@medisync.local` | `receptionist@medisync.com` |
| **Pharmacist** | `pharmacist@medisync.local` | `pharmacist@medisync.com` |
| **Patient** | `patient@medisync.local` | `patient@medisync.com` |

---

## API Endpoints

### Health Check
- `GET /api/health`
  - Response: `{ success: true, message: "MediSync AI backend is running", database: "connected" }`

### Authentication (`/api/auth`)
- `POST /api/auth/register`
  - Body: `{ firstName, lastName, email, phone, password }`
  - Public registration creates accounts with the `patient` role.
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ success: true, token: "...", user: { id, firstName, lastName, name, email, role, ... } }`
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Returns current authenticated user profile.
- `POST /api/auth/logout`
  - Clears session state.
- `GET /api/auth/admin-test`
  - Headers: `Authorization: Bearer <admin_token>`
  - RBAC verification endpoint restricted strictly to `admin`.
