/*
  Warnings:

  - You are about to drop the column `canalId` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `hospedeDaReservaId` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `imovelId` on the `Reserva` table. All the data in the column will be lost.
  - You are about to alter the column `valorTotal` on the `Reserva` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `totalTaxasExtras` on the `Reserva` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `totalPago` on the `Reserva` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `pendenteQuitacao` on the `Reserva` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to drop the `Agente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Bloqueio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Canal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Condominio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HospedeDaReserva` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Imovel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Proprietario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaxaDaReserva` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[localizador]` on the table `Reserva` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idExterno]` on the table `Reserva` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Bloqueio" DROP CONSTRAINT "Bloqueio_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "Imovel" DROP CONSTRAINT "Imovel_condominioId_fkey";

-- DropForeignKey
ALTER TABLE "Imovel" DROP CONSTRAINT "Imovel_proprietarioId_fkey";

-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_agenteId_fkey";

-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_canalId_fkey";

-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_hospedeDaReservaId_fkey";

-- DropForeignKey
ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "TaxaDaReserva" DROP CONSTRAINT "TaxaDaReserva_reservaId_fkey";

-- AlterTable
ALTER TABLE "Reserva" DROP COLUMN "canalId",
DROP COLUMN "hospedeDaReservaId",
DROP COLUMN "imovelId",
ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "localizador" SET DATA TYPE TEXT,
ALTER COLUMN "idExterno" SET DATA TYPE TEXT,
ALTER COLUMN "partnerCode" SET DATA TYPE TEXT,
ALTER COLUMN "moeda" SET DATA TYPE TEXT,
ALTER COLUMN "valorTotal" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "totalTaxasExtras" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "totalPago" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "pendenteQuitacao" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "linkStays" SET DATA TYPE TEXT,
ALTER COLUMN "origem" SET DATA TYPE TEXT,
ALTER COLUMN "condominio" SET DATA TYPE TEXT,
ALTER COLUMN "regiao" SET DATA TYPE TEXT,
ALTER COLUMN "idImovelStays" SET DATA TYPE TEXT,
ALTER COLUMN "imovelOficialSku" SET DATA TYPE TEXT,
ALTER COLUMN "canaisTitulo" SET DATA TYPE TEXT,
ALTER COLUMN "agenteId" DROP NOT NULL,
ALTER COLUMN "agenteId" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "Agente";

-- DropTable
DROP TABLE "Bloqueio";

-- DropTable
DROP TABLE "Canal";

-- DropTable
DROP TABLE "Condominio";

-- DropTable
DROP TABLE "HospedeDaReserva";

-- DropTable
DROP TABLE "Imovel";

-- DropTable
DROP TABLE "Proprietario";

-- DropTable
DROP TABLE "TaxaDaReserva";

-- CreateTable
CREATE TABLE "Hospede" (
    "id" SERIAL NOT NULL,
    "idExterno" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "email" TEXT,
    "dataDeNascimento" TIMESTAMP(3),
    "nacionalidade" TEXT,
    "fonte" TEXT NOT NULL,
    "reservaId" INTEGER NOT NULL,
    "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Hospede_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hospede_idExterno_key" ON "Hospede"("idExterno");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_localizador_key" ON "Reserva"("localizador");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_idExterno_key" ON "Reserva"("idExterno");

-- AddForeignKey
ALTER TABLE "Hospede" ADD CONSTRAINT "Hospede_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
