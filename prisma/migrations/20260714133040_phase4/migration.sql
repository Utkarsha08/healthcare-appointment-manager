-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "about" TEXT,
ADD COLUMN     "consultationFee" INTEGER,
ADD COLUMN     "experienceYears" INTEGER,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "qualification" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "phone" TEXT;
