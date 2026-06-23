-- DropForeignKey
ALTER TABLE `Entrega` DROP FOREIGN KEY `Entrega_motoristaId_fkey`;

-- DropIndex
DROP INDEX `Entrega_motoristaId_fkey` ON `Entrega`;

-- AlterTable
ALTER TABLE `Entrega` MODIFY `motoristaId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Entrega` ADD CONSTRAINT `Entrega_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
