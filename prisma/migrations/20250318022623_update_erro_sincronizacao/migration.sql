/*
  Warnings:

  - You are about to drop the column `dataErro` on the `ErroSincronizacaoJestor` table. All the data in the column will be lost.
  - You are about to drop the column `dataErro` on the `ErroSincronizacaoStays` table. All the data in the column will be lost.
  - Added the required column `hora` to the `ErroSincronizacaoJestor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora` to the `ErroSincronizacaoStays` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ErroSincronizacaoJestor" DROP COLUMN "dataErro",
ADD COLUMN     "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hora" TEXT NOT NULL,
ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ErroSincronizacaoStays" DROP COLUMN "dataErro",
ADD COLUMN     "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hora" TEXT NOT NULL,
ADD COLUMN     "sincronizadoNoJestor" BOOLEAN NOT NULL DEFAULT false;
