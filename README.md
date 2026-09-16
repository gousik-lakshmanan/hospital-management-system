# MediSync AI – Intelligent Integrated Hospital Management System

MediSync AI is a modern, full-stack Hospital Management and Healthcare Assistance platform featuring multi-persona role-based access control (RBAC), intelligent workflows, and scalable REST API services.

---

## Architecture Overview
- **Frontend**: React 19, Tailwind CSS 4, React Router 7, Lucide Icons, Recharts (`http://localhost:5173`)
- **Backend**: Node.js, Express.js, JWT Authentication, bcryptjs password hashing (`http://localhost:5000`)
- **Database**: MongoDB Atlas (`medisync_ai` database, `users` collection)

---

## Getting Started

### 1. Backend Setup
```bash
cd Backend
npm install
node seed.js    # Populates development test accounts in MongoDB
npm run dev     # Runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd Frontend
npm install
npm run dev     # Runs on http://localhost:5173
```

---

## Default Development Accounts
All development seed accounts use password: **`MediSync@123`**

| Role | Email |
|---|---|
| **Administrator** | `admin@medisync.local` (or `admin@medisync.com`) |
| **Doctor** | `doctor@medisync.local` (or `arun.kumar@medisync.com`) |
| **Nurse** | `nurse@medisync.local` (or `anitha@medisync.com`) |
| **Receptionist** | `receptionist@medisync.local` (or `receptionist@medisync.com`) |
| **Pharmacist** | `pharmacist@medisync.local` (or `pharmacist@medisync.com`) |
| **Patient** | `patient@medisync.local` (or `patient@medisync.com`) |

---

## Health Check
- Verify API & Database: `GET http://localhost:5000/api/health`
