🏥 Healthcare Appointment & Follow-up Manager
A full-stack healthcare platform engineered to streamline clinical scheduling, patient onboarding, and automated post-visit follow-ups. Built with a modern architecture leveraging serverless database operations, role-based access controls, and generative AI integration.

🚀 Features & Roadmap
🟢 Phase 1: Core Architecture & Administration (Completed)
Modern Framework: Built using Next.js 14 (App Router), TypeScript, and TailwindCSS.

Secure Authentication: Role-Based Access Control (RBAC) powered by NextAuth.js (Credentials Provider).

Administrative Suite: Centralized dashboards for staff management, credentialing, and configuration.

Availability Engines: Custom logic for setting daily working hours, scheduling recurring shifts, and managing leave data.

🟡 Phase 2: Patient Portal & Intelligent Booking (In Progress)
Patient Dashboard: Consolidated portal for medical histories and appointment timelines.

Optimized Scheduling: Real-time doctor search paired with race-condition safe slot reservation to prevent double bookings.

AI-Powered Triaging: Pre-consultation symptom analysis powered by Gemini AI.

Dynamic Rescheduling: Automation handling unexpected clinician leave and subsequent patient rescheduling queues.

Edit: AI Integration

Gemini AI is used to generate pre-visit summaries.

If Gemini is temporarily unavailable or rate limited,
appointment confirmation still succeeds and the application
gracefully stores `preVisitSummary = null` while displaying
"AI summary unavailable" to the user.

🔴 Phase 3: Clinical Workflows & Integrations (Upcoming)
Doctor Workspace: Dedicated portal tracking daily patient queues and clinical records.

Automated Summaries: Automated generation of post-visit clinical notes and care instructions using Gemini AI.

Notification Engine: Automated medication alerts and transactional booking updates driven by Resend.

External Ecosystems: Bi-directional calendar synchronization via the Google Calendar API.

🛠️ Tech Stack
Framework: Next.js 14 (App Router)
Language: TypeScript
Database: PostgreSQL (Neon Serverless)
ORM: Prisma
Authentication: NextAuth.js
AI Engine: Gemini API
Email Gateway: Resend
External API: Google Calendar API

⚙️ Installation
1. Repository Setup:
   git clone https://github.com/Utkarsha08/healthcare-appointment-manager.git
   cd healthcare-appointment-manager
2. Dependency Management:npm install
3. Environment Configuration: Create your environment file using the provided boilerplate template:
   cp .env.example .env
4. Database Setup & Migration: Generate your database schema and execute seeds for the testing environment:
   npx prisma migrate dev
   npx prisma db seed
5. Local Execution:
   npm run dev

👥 Seed Profiles for Testing:
| Access Level  | Email Reference      | Secure Password |
|---------------|----------------------|-----------------|
| Admin         | admin@example.com    | password123     |
| Doctor        | doctor1@example.com  | password123     |
| Patient       | patient1@example.com | password123     |

🧑‍💻 Author
Developed by Utkarsha Dhawale