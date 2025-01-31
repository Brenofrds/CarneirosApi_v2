/*
  Warnings:

  - You are about to drop the `_AgenteToReserva` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_AgenteToReserva" DROP CONSTRAINT "_AgenteToReserva_A_fkey";

-- DropForeignKey
ALTER TABLE "_AgenteToReserva" DROP CONSTRAINT "_AgenteToReserva_B_fkey";

-- DropTable
DROP TABLE "_AgenteToReserva";

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("idExterno") ON DELETE SET NULL ON UPDATE CASCADE;
