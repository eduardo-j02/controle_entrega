-- AlterTable
ALTER TABLE `Rota`
  ADD COLUMN `origem` VARCHAR(191) NULL,
  ADD COLUMN `destino` VARCHAR(191) NULL,
  ADD COLUMN `distanciaKm` DOUBLE NULL,
  ADD COLUMN `tempoEstimadoMinutos` INTEGER NULL,
  ADD COLUMN `custoPedagio` DOUBLE NULL,
  ADD COLUMN `dataOtimizacao` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `PontoParada` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `rotaId` INTEGER NOT NULL,
  `endereco` VARCHAR(191) NOT NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `ordem` INTEGER NOT NULL,
  `tipo` ENUM('ORIGEM', 'ENTREGA', 'DESTINO') NOT NULL,
  `notaId` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `PontoParada_rotaId_ordem_idx`(`rotaId`, `ordem`),
  INDEX `PontoParada_notaId_idx`(`notaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracaPedagio` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(191) NOT NULL,
  `rodovia` VARCHAR(191) NOT NULL,
  `km` DOUBLE NULL,
  `latitude` DOUBLE NOT NULL,
  `longitude` DOUBLE NOT NULL,
  `valorCarro` DOUBLE NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `PracaPedagio_latitude_longitude_idx`(`latitude`, `longitude`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PontoParada`
  ADD CONSTRAINT `PontoParada_rotaId_fkey`
  FOREIGN KEY (`rotaId`) REFERENCES `Rota`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PontoParada`
  ADD CONSTRAINT `PontoParada_notaId_fkey`
  FOREIGN KEY (`notaId`) REFERENCES `Nota`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
