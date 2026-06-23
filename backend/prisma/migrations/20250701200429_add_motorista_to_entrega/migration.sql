/*
  Warnings:

  - Added the required column `motoristaId` to the `Entrega` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Entrega` ADD COLUMN `motoristaId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Entrega` ADD CONSTRAINT `Entrega_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
