/*
  Warnings:

  - The `agenteId` column on the `Reserva` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_agenteId_fkey";

-- AlterTable
ALTER TABLE "Reserva" DROP COLUMN "agenteId",
ADD COLUMN     "agenteId" INTEGER;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
