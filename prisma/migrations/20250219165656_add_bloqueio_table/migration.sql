-- CreateTable
CREATE TABLE "Bloqueio" (
    "id" SERIAL NOT NULL,
    "idExterno" TEXT NOT NULL,
    "localizador" TEXT NOT NULL,
    "checkIn" TEXT NOT NULL,
    "checkOut" TEXT NOT NULL,
    "horaCheckIn" TEXT,
    "horaCheckOut" TEXT,
    "notaInterna" TEXT,
    "imovelId" INTEGER NOT NULL,
    "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Bloqueio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bloqueio_idExterno_key" ON "Bloqueio"("idExterno");

-- CreateIndex
CREATE UNIQUE INDEX "Bloqueio_localizador_key" ON "Bloqueio"("localizador");

-- CreateIndex
CREATE UNIQUE INDEX "Bloqueio_idExterno_imovelId_key" ON "Bloqueio"("idExterno", "imovelId");

-- AddForeignKey
ALTER TABLE "Bloqueio" ADD CONSTRAINT "Bloqueio_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
