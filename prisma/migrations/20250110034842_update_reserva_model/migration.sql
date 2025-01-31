/*
  Warnings:

  - You are about to drop the column `atualizadoEm` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `atualizadoPor` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `chatReserva` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `criadoEm` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `criadoPor` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `idAutomacao` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `nomeDoImovelPersonalizado` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `observacoes` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `periodoDaReservaFim` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `periodoDaReservaInicio` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `processamentoPg` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `responsavel` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `sincronizadoNoJestor` on the `Reserva` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reserva" DROP COLUMN "atualizadoEm",
DROP COLUMN "atualizadoPor",
DROP COLUMN "chatReserva",
DROP COLUMN "criadoEm",
DROP COLUMN "criadoPor",
DROP COLUMN "idAutomacao",
DROP COLUMN "nomeDoImovelPersonalizado",
DROP COLUMN "observacoes",
DROP COLUMN "periodoDaReservaFim",
DROP COLUMN "periodoDaReservaInicio",
DROP COLUMN "processamentoPg",
DROP COLUMN "responsavel",
DROP COLUMN "sincronizadoNoJestor";
