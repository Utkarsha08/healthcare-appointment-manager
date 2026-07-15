import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'System Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // 2. Create Doctors
  const docs = [
    {
      email: 'doctor1@example.com',
      name: 'Dr. Alice Smith',
      specialisation: 'Cardiologist',
      workingHours: { mon: ['09:00', '17:00'], tue: ['09:00', '17:00'], wed: ['09:00', '17:00'], thu: ['09:00', '17:00'], fri: ['09:00', '17:00'] },
    },
    {
      email: 'doctor2@example.com',
      name: 'Dr. Bob Johnson',
      specialisation: 'Dermatologist',
      workingHours: { mon: ['10:00', '18:00'], wed: ['10:00', '18:00'], fri: ['10:00', '18:00'] },
    },
    {
      email: 'doctor3@example.com',
      name: 'Dr. Carol Williams',
      specialisation: 'Pediatrician',
      workingHours: { tue: ['08:00', '16:00'], thu: ['08:00', '16:00'], sat: ['08:00', '12:00'] },
    },
  ];

  for (const doc of docs) {
    await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        name: doc.name,
        passwordHash,
        role: Role.DOCTOR,
        doctorProfile: {
          create: {
            specialisation: doc.specialisation,
            workingHours: doc.workingHours,
            phone: "+1234567890",
            experienceYears: 10,
            qualification: "MD",
            consultationFee: 150,
            about: "Experienced specialist committed to patient care.",
          },
        },
      },
    });
  }

  // 3. Create Patients
  const patients = [
    { email: 'patient1@example.com', name: 'John Doe' },
    { email: 'patient2@example.com', name: 'Jane Doe' },
  ];

  for (const p of patients) {
    await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        name: p.name,
        passwordHash,
        role: Role.PATIENT,
        dateOfBirth: new Date("1990-01-01"),
        gender: "Male",
        phone: "+0987654321",
        bloodGroup: "O+",
        address: "123 Main St, Anytown",
        emergencyContactName: "Emergency Contact",
        emergencyContactPhone: "+1122334455",
      },
    });
  }

}

main()
  .then(async () => {
    console.log("✅ Database seeded successfully!");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error while seeding database:");
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
