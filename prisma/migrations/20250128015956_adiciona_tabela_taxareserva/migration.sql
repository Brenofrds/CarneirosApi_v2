-- CreateTable
CREATE TABLE "TaxaReserva" (
    "id" SERIAL NOT NULL,
    "reservaId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TaxaReserva_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaxaReserva" ADD CONSTRAINT "TaxaReserva_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
