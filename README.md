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
- **External Ecosystems**: Bi-directional calendar synchronization via the official `googleapis` package, operating entirely independently of core transactions.

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
- **External API**: Google Calendar API

## 📅 Integrations & Setup

### Google Calendar Integration

To enable automatic calendar synchronization for appointments, you must configure the Google Calendar API:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable the **Google Calendar API** under "APIs & Services".
3. Configure the **OAuth Consent Screen**.
4. Under Credentials, create an **OAuth client ID** (Web Application).
5. Generate a **Refresh Token** via the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/):
   - Scope: `https://www.googleapis.com/auth/calendar`
6. Provide these credentials in your `.env` file (see Environment Variables).

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

# Google Calendar API
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REFRESH_TOKEN="your-refresh-token"
GOOGLE_CALENDAR_ID="primary" # Or a specific calendar ID
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
- **Doctor (Cardiology)**: `doctor1@example.com`
- **Doctor (Dermatology)**: `doctor2@example.com`
- **Patient**: `patient@example.com` (Or create your own via `/register`!)