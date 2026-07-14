🏥 System Design – Healthcare Appointment & Follow-up Manager
Overview

The Healthcare Appointment & Follow-up Manager is designed as a full-stack healthcare platform that prioritizes reliability, scalability, and user experience. The system supports three user roles—Admin, Doctor, and Patient—and integrates AI-assisted clinical workflows, Google Calendar synchronization, email notifications, medication reminders, and asynchronous background processing. The architecture separates user-facing operations from external service integrations to ensure that failures in third-party services never interrupt core healthcare workflows.

Double-Booking Prevention

To prevent multiple patients from booking the same appointment slot, the system implements a two-phase booking workflow.

When a patient selects a slot, the application validates the doctor's working hours, leave schedule, and existing appointments before placing a temporary hold on the slot. During confirmation, Prisma transactions and database constraints ensure atomicity. A unique constraint on the combination of Doctor ID and Appointment Start Time guarantees that only one confirmed appointment can exist for a given slot.

If two patients attempt to book the same slot simultaneously, one transaction succeeds while the other safely fails with a handled conflict response. This approach prevents race conditions without requiring complex locking mechanisms.

Doctor Leave Conflict Handling

Administrators can configure leave days for doctors through the Admin Portal.

When a leave day is created, the system identifies all affected appointments that overlap with the unavailable period. These appointments are automatically cancelled within a database transaction to maintain consistency.

After the transaction completes, background jobs notify affected patients through email and in-app notifications. Since notification delivery occurs asynchronously, appointment cancellation is never blocked by temporary email or external service failures.

This design guarantees that scheduling data remains accurate while ensuring patients are informed promptly.

Slot Hold Mechanism

The booking system follows a hold-and-confirm approach rather than creating appointments immediately.

Patients first reserve a slot through a temporary hold process. During confirmation, the system performs final availability validation inside a Prisma transaction before permanently creating the appointment.

This mechanism minimizes conflicts caused by concurrent users while providing a responsive booking experience. Because validation occurs immediately before database insertion, stale availability information cannot create duplicate bookings.

Notification Failure Handling

The platform uses a custom background job system backed by PostgreSQL for all non-critical operations.

Tasks such as:

Email notifications
Google Calendar synchronization
Medication reminders

are stored as durable background jobs rather than executed directly during user requests.

Each job contains its execution status, retry information, and scheduled execution time. A scheduled cron endpoint periodically processes pending jobs.

If an external service such as Gmail, Google Calendar, or Gemini AI becomes temporarily unavailable, the background job is retried automatically without affecting the user's original action. Permanent failures are logged while allowing the application to continue functioning normally.

This asynchronous architecture keeps booking, consultation, and cancellation operations fast and reliable even when third-party services experience outages.

AI Integration

Gemini AI is integrated into two stages of the clinical workflow.

Before an appointment, the patient's symptoms are analyzed to generate an urgency level, chief complaint, and suggested discussion points for the doctor.

After consultation, the doctor's clinical notes are transformed into a patient-friendly summary explaining the diagnosis, medications, and follow-up instructions.

AI processing is isolated from core database transactions. If the AI service is unavailable or rate-limited, appointments and consultations continue successfully while displaying an appropriate fallback message instead of interrupting clinical operations.

Overall Architecture

The application follows a modular service-oriented architecture using Next.js 14, Prisma ORM, PostgreSQL (Neon), NextAuth.js, and Tailwind CSS.

Business logic is organized into dedicated service layers, while external integrations such as Google Calendar, Gemini AI, email delivery, and medication reminders operate through asynchronous background jobs. This separation improves maintainability, scalability, and fault tolerance while keeping the user experience responsive.

The resulting architecture provides a production-ready healthcare platform capable of safely managing appointments, clinical documentation, AI-assisted workflows, notifications, and third-party integrations with strong emphasis on consistency, reliability, and graceful failure handling.