/*
  Warnings:

  - A unique constraint covering the columns `[reservaId,name]` on the table `TaxaReserva` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TaxaReserva_reservaId_name_key" ON "TaxaReserva"("reservaId", "name");
