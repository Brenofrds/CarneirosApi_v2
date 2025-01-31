-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "imovelId" INTEGER;

-- CreateTable
CREATE TABLE "Imovel" (
    "id" SERIAL NOT NULL,
    "idExterno" TEXT NOT NULL,
    "idStays" TEXT NOT NULL,
    "sku" TEXT,
    "status" TEXT NOT NULL,
    "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Imovel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Imovel_idExterno_key" ON "Imovel"("idExterno");

-- CreateIndex
CREATE UNIQUE INDEX "Imovel_idStays_key" ON "Imovel"("idStays");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
