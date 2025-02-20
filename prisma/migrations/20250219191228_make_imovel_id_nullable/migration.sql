-- DropForeignKey
ALTER TABLE "Bloqueio" DROP CONSTRAINT "Bloqueio_imovelId_fkey";

-- AlterTable
ALTER TABLE "Bloqueio" ALTER COLUMN "imovelId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Bloqueio" ADD CONSTRAINT "Bloqueio_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
