/*
  Warnings:

  - A unique constraint covering the columns `[chaveXml]` on the table `Nota` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Nota_chaveXml_key` ON `Nota`(`chaveXml`);
