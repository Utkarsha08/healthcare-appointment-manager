# 🏥 Healthcare Appointment & Follow-up Manager

A full-stack, production-ready healthcare platform engineered to streamline clinical scheduling, patient onboarding, and automated post-visit follow-ups. Built with a modern architecture leveraging serverless database operations, role-based access controls, robust transactional safety, and generative AI integration.

## 🚀 Features & Modules

### 🟢 Phase 1: Core Architecture & Administration (Completed)
- **Modern Framework**: Next.js 14 (App Router), strict TypeScript, and TailwindCSS.
- **Secure Authentication**: Role-Based Access Control (RBAC) via NextAuth.js (`PATIENT`, `DOCTOR`, `ADMIN`).
- **Administrative Suite**: Dashboards for staff management, credentialing, and configuration.
- **Availability Engines**: Logic for setting daily working hours, recurring shifts, and managing leave days.

### 🟢 Phase 2: Patient Portal & Intelligent Booking (Completed)
- **Patient Dashboard**: Portal for medical histories, structured prescriptions, and appointment timelines.
- **Self-Registration**: Dedicated `/register` flow with strict validation, `bcrypt` password hashing, unique constraints, and auto-login.
- **Optimized Scheduling**: Real-time doctor search paired with race-condition safe slot reservation to prevent double bookings.
- **AI-Powered Triaging**: Pre-consultation symptom analysis powered by Gemini AI with robust transaction fallbacks.
- **Dynamic Rescheduling**: Automation handling clinician leave, canceling conflicting appointments, and notifying patients.

### 🟢 Phase 3: Clinical Workflows & Integrations (Completed)
- **Doctor Workspace**: Dedicated portal prioritizing today's active appointments.
- **Automated Summaries**: Generation of post-visit clinical notes and care instructions using Gemini AI.
- **Notification Engine**: Atomic, transaction-bound notification system handling booking, completion, and cancellation alerts.

### 🟢 Phase 4: Authentication, Profiles & Production Readiness (Completed)
- **Universal User Menu**: A unified layout component handles Profile, Logout, and Change Password functionality across all portals seamlessly.
- **Extended User Schemas**: The `User` and `Doctor` models now directly incorporate optional demographic and professional fields, avoiding the need for unnecessary related models.
- **Profile Management**: Editable profiles for Patients, Doctors, and Admins.
- **Security**: Dedicated `/change-password` route with bcrypt hashing and current password verification.

## 🛠️ Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma (with two-phase transactional logic to isolate third-party APIs)
- **Authentication**: NextAuth.js (Credentials Provider)
- **AI Engine**: Gemini API (`@google/genai`)

## 📅 Integrations & Setup

### Generative AI Integration

Gemini AI is used to generate pre-visit and post-visit summaries. If Gemini is temporarily unavailable or rate-limited, core transactions (e.g., booking an appointment or completing a consultation) will still succeed gracefully, defaulting to `null` and displaying an "AI summary unavailable" empty state.

## ⚙️ Environment Variables

Create your `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host/db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-random-string"

# AI Integration
GEMINI_API_KEY="your-gemini-api-key"

# Email Configuration (Nodemailer)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password"
SMTP_FROM='"Healthcare Manager" <noreply@example.com>'
```

## 🚀 Installation & Local Execution

1. **Repository Setup**:
   ```bash
   git clone https://github.com/Utkarsha08/healthcare-appointment-manager.git
   cd healthcare-appointment-manager
   ```
2. **Dependency Management**:
   ```bash
   npm install
   ```
3. **Database Setup & Migration**:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```
4. **Local Execution**:
   ```bash
   npm run dev
   ```

## 👥 Demo Accounts

The seed script creates the following demo accounts with the password `password123`:

- **Admin**: `admin@example.com`
- **Doctor 1**: `doctor1@example.com`
- **Doctor 2**: `doctor2@example.com`
- **Doctor 3**: `doctor3@example.com`
- **Patient 1**: `patient1@example.com` (Or create your own via `/register`!)
- **Patient 2**: `patient2@example.com`