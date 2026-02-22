/*
  Warnings:

  - A unique constraint covering the columns `[categoryId,name]` on the table `Skill` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `SkillCategory` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Skill_name_categoryId_key";

-- AlterTable
ALTER TABLE "Skill"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "updatedAt" TIMESTAMP(3),
ALTER COLUMN "proficiency" SET DEFAULT 5;

UPDATE "Skill"
SET "updatedAt" = NOW()
WHERE "updatedAt" IS NULL;

ALTER TABLE "Skill"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "SkillCategory"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "SkillCategory"
SET "updatedAt" = NOW()
WHERE "updatedAt" IS NULL;

ALTER TABLE "SkillCategory"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Skill_categoryId_name_key" ON "Skill"("categoryId", "name");
