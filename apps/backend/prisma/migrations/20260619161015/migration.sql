/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `prompts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "prompts_title_key" ON "prompts"("title");
