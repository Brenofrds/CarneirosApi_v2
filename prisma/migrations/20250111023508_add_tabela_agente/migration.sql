-- CreateTable
CREATE TABLE "Agente" (
    "id" SERIAL NOT NULL,
    "idExterno" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Agente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AgenteToReserva" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AgenteToReserva_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agente_idExterno_key" ON "Agente"("idExterno");

-- CreateIndex
CREATE INDEX "_AgenteToReserva_B_index" ON "_AgenteToReserva"("B");

-- AddForeignKey
ALTER TABLE "_AgenteToReserva" ADD CONSTRAINT "_AgenteToReserva_A_fkey" FOREIGN KEY ("A") REFERENCES "Agente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgenteToReserva" ADD CONSTRAINT "_AgenteToReserva_B_fkey" FOREIGN KEY ("B") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
