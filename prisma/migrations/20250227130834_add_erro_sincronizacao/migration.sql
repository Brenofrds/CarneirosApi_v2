-- CreateTable
CREATE TABLE "ErroSincronizacao" (
    "id" SERIAL NOT NULL,
    "tabela" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "erro" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "dataErro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErroSincronizacao_pkey" PRIMARY KEY ("id")
);
