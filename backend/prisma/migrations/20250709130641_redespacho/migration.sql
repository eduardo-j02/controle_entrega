-- AlterTable
ALTER TABLE `Entrega` ADD COLUMN `redespacho` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `EntregaMotorista` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entregaId` INTEGER NOT NULL,
    `motoristaId` INTEGER NOT NULL,
    `ordem` INTEGER NOT NULL,
    `dataVinculo` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataTransferencia` DATETIME(3) NULL,

    UNIQUE INDEX `EntregaMotorista_entregaId_motoristaId_key`(`entregaId`, `motoristaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EntregaMotorista` ADD CONSTRAINT `EntregaMotorista_entregaId_fkey` FOREIGN KEY (`entregaId`) REFERENCES `Entrega`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntregaMotorista` ADD CONSTRAINT `EntregaMotorista_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
