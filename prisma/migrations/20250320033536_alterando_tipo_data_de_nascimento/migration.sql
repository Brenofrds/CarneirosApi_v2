/*
  Warnings:

  - The `dataDeNascimento` column on the `Hospede` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Hospede" DROP COLUMN "dataDeNascimento",
ADD COLUMN     "dataDeNascimento" TIMESTAMP(3);
