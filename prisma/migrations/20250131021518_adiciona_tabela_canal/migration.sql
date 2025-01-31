-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "canalId" INTEGER;

-- CreateTable
CREATE TABLE "Canal" (
    "id" SERIAL NOT NULL,
    "idExterno" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,

    CONSTRAINT "Canal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Canal_idExterno_key" ON "Canal"("idExterno");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "Canal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
