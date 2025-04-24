/*
  Warnings:

  - You are about to drop the column `convidadosExtras` on the `Hospede` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ErroSincronizacaoStays" ADD COLUMN     "payloadJson" TEXT;

-- AlterTable
ALTER TABLE "Hospede" DROP COLUMN "convidadosExtras";
