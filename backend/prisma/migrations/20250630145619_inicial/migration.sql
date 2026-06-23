-- CreateTable
CREATE TABLE `Nota` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(191) NOT NULL,
    `emissor` VARCHAR(191) NOT NULL,
    `destinatario` VARCHAR(191) NOT NULL,
    `dataEmissao` DATETIME(3) NOT NULL,
    `arquivo` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Entrega` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `notaId` INTEGER NOT NULL,
    `dataEntrega` DATETIME(3) NOT NULL,
    `comprovante` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ocorrencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entregaId` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Entrega` ADD CONSTRAINT `Entrega_notaId_fkey` FOREIGN KEY (`notaId`) REFERENCES `Nota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ocorrencia` ADD CONSTRAINT `Ocorrencia_entregaId_fkey` FOREIGN KEY (`entregaId`) REFERENCES `Entrega`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
