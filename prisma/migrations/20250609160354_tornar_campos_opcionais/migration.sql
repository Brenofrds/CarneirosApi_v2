-- AlterTable
ALTER TABLE "Reserva" ALTER COLUMN "horaCheckIn" DROP NOT NULL,
ALTER COLUMN "horaCheckOut" DROP NOT NULL,
ALTER COLUMN "quantidadeHospedes" DROP NOT NULL,
ALTER COLUMN "quantidadeAdultos" DROP NOT NULL,
ALTER COLUMN "quantidadeCriancas" DROP NOT NULL,
ALTER COLUMN "quantidadeInfantil" DROP NOT NULL,
ALTER COLUMN "moeda" DROP NOT NULL;
