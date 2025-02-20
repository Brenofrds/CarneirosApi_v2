-- AlterTable
ALTER TABLE "Imovel" ADD COLUMN     "proprietarioId" INTEGER;

-- CreateTable
CREATE TABLE "Proprietario" (
    "id" SERIAL NOT NULL,
    "idExterno" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Proprietario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proprietario_idExterno_key" ON "Proprietario"("idExterno");

-- AddForeignKey
ALTER TABLE "Imovel" ADD CONSTRAINT "Imovel_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Proprietario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
