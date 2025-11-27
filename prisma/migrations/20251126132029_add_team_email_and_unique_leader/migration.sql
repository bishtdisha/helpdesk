/*
  Warnings:

  - A unique constraint covering the columns `[teamId]` on the table `team_leaders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `teams` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "team_leaders_teamId_key" ON "team_leaders"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_email_key" ON "teams"("email");
