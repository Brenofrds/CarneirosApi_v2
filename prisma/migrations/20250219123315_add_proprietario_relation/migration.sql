/*
  Warnings:

  - You are about to drop the column `idExterno` on the `Proprietario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nome,telefone]` on the table `Proprietario` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Proprietario_idExterno_key";

-- AlterTable
ALTER TABLE "Proprietario" DROP COLUMN "idExterno";

-- CreateIndex
CREATE UNIQUE INDEX "Proprietario_nome_telefone_key" ON "Proprietario"("nome", "telefone");
