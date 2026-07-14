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

# Google Calendar OAuth 2.0 (For Doctors)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/calendar/callback"
```

## 🗓️ Google Calendar Integration
Healthcare Appointment Manager enables doctors to securely connect their Google Calendars using OAuth 2.0. This is a one-way synchronization (Application → Google Calendar) to mirror appointments accurately.

### Setup Instructions
1. Navigate to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Create a new project and enable the **Google Calendar API**.
3. Configure the **OAuth Consent Screen**:
   - Add scopes: `.../auth/calendar.events` and `.../auth/userinfo.email`.
   - Add test users (your doctor's email addresses) if the app is in testing mode.
4. Go to **Credentials** and create an **OAuth client ID** (Web application).
5. Add the Authorized redirect URI: `http://localhost:3000/api/calendar/callback`.
6. Copy the generated Client ID and Client Secret into your `.env` file.

### How Doctors Connect
1. A doctor logs into their account and navigates to **My Profile**.
2. In the **Google Calendar** card, they click **Connect Google Calendar**.
3. They authorize the application.
4. Future booked, updated, and cancelled appointments will seamlessly sync to their Google Calendar via background processing, ensuring bookings are never blocked if the Google API is temporarily unavailable.

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

## 🗄️ Database Schema Overview

The platform uses a relational Postgres schema designed for atomicity:
- **User**: Base identity model storing credentials, RBAC roles (`ADMIN`, `DOCTOR`, `PATIENT`), and OAuth tokens.
- **Doctor**: Extension model storing clinical specifics (working hours, slot duration).
- **Appointment**: The central model. Relates Patient to Doctor. Stores slot times, AI summaries, `doctorNotes`, `prescription` JSON, and Google Calendar IDs.
- **Notification**: UI notification tracker with `isRead` states.
- **BackgroundJob**: Durable task queue model driving emails, calendar syncing, and medication reminders.
- **LeaveDay**: Tracks doctor unavailability.

## 🧠 LLM Prompts Overview

Generative AI (Gemini) is integrated via two key system prompts:
1. **Symptom Triaging**: Formats patient inputs into structured, professional medical summaries, identifying potential urgencies and suggesting context-aware questions for the doctor.
2. **Post-Visit Summary**: Translates the doctor's shorthand clinical notes into a patient-friendly, easy-to-read explanation of the diagnosis and care plan.

## 🔄 Background Job Architecture

The system features a custom, lightweight task queue built on top of Postgres to guarantee non-blocking operations:
- **`process-jobs` cron endpoint**: Processes pending jobs incrementally.
- **Medication Reminders**: Automatically parsed from free-text prescriptions and scheduled for specific timestamps using `executeAt` logic.
- **Calendar Sync**: Background retries for Google Calendar API interactions ensure transient network failures never break UI responsiveness.

## 🚀 Deployment Guide

This repository is fully optimized for **Vercel** deployment:
1. Fork or push this repository to GitHub.
2. Import the project into Vercel.
3. Provision a **Neon Serverless Postgres** database and set `DATABASE_URL`.
4. Add all environment variables (Google OAuth, Resend/SMTP, Gemini).
5. **CRON Setup**: To keep the background worker processing, set up a Vercel Cron Job targeting `/api/cron/process-jobs` every 1 minute.
6. Deploy!

## 👥 Demo Accounts

The seed script creates the following demo accounts with the password `password123`:

- **Admin**: `admin@example.com`
- **Doctor 1**: `doctor1@example.com`
- **Doctor 2**: `doctor2@example.com`
- **Doctor 3**: `doctor3@example.com`
- **Patient 1**: `patient1@example.com`
- **Patient 2**: `patient2@example.com`