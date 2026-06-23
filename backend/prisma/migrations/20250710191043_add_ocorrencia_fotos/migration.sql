/*
  Warnings:

  - You are about to drop the column `data` on the `Ocorrencia` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Ocorrencia` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Ocorrencia` DROP COLUMN `data`,
    DROP COLUMN `tipo`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `OcorrenciaFoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ocorrenciaId` INTEGER NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OcorrenciaFoto` ADD CONSTRAINT `OcorrenciaFoto_ocorrenciaId_fkey` FOREIGN KEY (`ocorrenciaId`) REFERENCES `Ocorrencia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
