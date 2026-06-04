-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MarriageStatus" AS ENUM ('CURRENT', 'DECEASED', 'DIVORCED');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "bodies" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "placeOfBirth" TEXT NOT NULL,
    "nickname" TEXT,
    "phoneNumber" TEXT,
    "occupation" TEXT,
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "deathDate" TEXT,
    "maritalStatus" "MaritalStatus" NOT NULL DEFAULT 'SINGLE',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fatherId" TEXT,
    "motherId" TEXT,

    CONSTRAINT "bodies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_photos" (
    "id" TEXT NOT NULL,
    "bodyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_spouses" (
    "id" TEXT NOT NULL,
    "bodyIdA" TEXT NOT NULL,
    "bodyIdB" TEXT NOT NULL,
    "status" "MarriageStatus" NOT NULL DEFAULT 'CURRENT',
    "marriageDate" TEXT,
    "endDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_spouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "bodyId" TEXT,
    "phoneNumber" TEXT,
    "profilePhoto" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "body_photos_bodyId_position_key" ON "body_photos"("bodyId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "body_spouses_bodyIdA_bodyIdB_key" ON "body_spouses"("bodyIdA", "bodyIdB");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_bodyId_key" ON "profiles"("bodyId");

-- AddForeignKey
ALTER TABLE "bodies" ADD CONSTRAINT "bodies_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bodies" ADD CONSTRAINT "bodies_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_photos" ADD CONSTRAINT "body_photos_bodyId_fkey" FOREIGN KEY ("bodyId") REFERENCES "bodies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_spouses" ADD CONSTRAINT "body_spouses_bodyIdA_fkey" FOREIGN KEY ("bodyIdA") REFERENCES "bodies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_spouses" ADD CONSTRAINT "body_spouses_bodyIdB_fkey" FOREIGN KEY ("bodyIdB") REFERENCES "bodies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_bodyId_fkey" FOREIGN KEY ("bodyId") REFERENCES "bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

