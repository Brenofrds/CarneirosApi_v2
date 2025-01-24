/*
  Warnings:

  - You are about to drop the column `fonte` on the `Hospede` table. All the data in the column will be lost.
  - You are about to drop the column `nacionalidade` on the `Hospede` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Hospede" DROP COLUMN "fonte",
DROP COLUMN "nacionalidade";

-- CreateTable
CREATE TABLE "Condominio" (
    "id" SERIAL NOT NULL,
    "idExterno" TEXT NOT NULL,
    "idStays" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "regiao" TEXT NOT NULL,
    "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Condominio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Condominio_idExterno_key" ON "Condominio"("idExterno");

-- CreateIndex
CREATE UNIQUE INDEX "Condominio_idStays_key" ON "Condominio"("idStays");
