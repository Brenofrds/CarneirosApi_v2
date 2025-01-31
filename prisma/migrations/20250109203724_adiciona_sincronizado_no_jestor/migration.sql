-- AlterTable
ALTER TABLE "Agente" ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Bloqueio" ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Canal" ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Condominio" ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "HospedeDaReserva" ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Imovel" ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TaxaDaReserva" ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;
