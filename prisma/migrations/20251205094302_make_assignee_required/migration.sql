/*
  Warnings:

  - Made the column `assignedTo` on table `tickets` required. This step will fail if there are existing NULL values in that column.

*/

-- First, update any NULL assignedTo values to the ticket creator
UPDATE "tickets" 
SET "assignedTo" = "createdBy" 
WHERE "assignedTo" IS NULL;

-- DropForeignKey
ALTER TABLE "public"."tickets" DROP CONSTRAINT "tickets_assignedTo_fkey";

-- AlterTable
ALTER TABLE "tickets" ALTER COLUMN "assignedTo" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
