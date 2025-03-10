/*
  Warnings:

  - You are about to drop the `ErroSincronizacao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ErroSincronizacao";

-- CreateTable
CREATE TABLE "ErroSincronizacaoJestor" (
    "id" SERIAL NOT NULL,
    "tabela" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "erro" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "dataErro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErroSincronizacaoJestor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErroSincronizacaoStays" (
    "id" SERIAL NOT NULL,
    "acao" TEXT NOT NULL,
    "payloadId" TEXT NOT NULL,
    "erro" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "dataErro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErroSincronizacaoStays_pkey" PRIMARY KEY ("id")
);
