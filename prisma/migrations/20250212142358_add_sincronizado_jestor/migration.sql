-- AlterTable
ALTER TABLE "Canal" ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TaxaReserva" ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;
