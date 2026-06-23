-- AlterTable
ALTER TABLE `Ocorrencia` ADD COLUMN `dataFinalizacao` DATETIME(3) NULL,
    ADD COLUMN `finalizadaPorId` INTEGER NULL,
    ADD COLUMN `protocoloErp` VARCHAR(191) NULL,
    ADD COLUMN `solucao` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('ABERTA', 'FECHADA') NOT NULL DEFAULT 'ABERTA';

-- AddForeignKey
ALTER TABLE `Ocorrencia` ADD CONSTRAINT `Ocorrencia_finalizadaPorId_fkey` FOREIGN KEY (`finalizadaPorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
