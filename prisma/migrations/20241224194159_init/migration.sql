-- CreateTable
CREATE TABLE "Proprietario" (
    "id" SERIAL NOT NULL,
    "cpf_cnpj" VARCHAR(45) NOT NULL,
    "proprietario_principal" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Proprietario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condominio" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(45) NOT NULL,
    "id_stays" TEXT NOT NULL,
    "atualizado_por" TEXT NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Condominio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Imovel" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(45) NOT NULL,
    "status" TEXT NOT NULL,
    "atualizadoPor" TEXT NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proprietarioId" INTEGER NOT NULL,
    "condominioId" INTEGER NOT NULL,

    CONSTRAINT "Imovel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bloqueio" (
    "id" SERIAL NOT NULL,
    "localizador" CHAR(5) NOT NULL,
    "id_externo" VARCHAR(45) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" VARCHAR(45) NOT NULL,
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "hora_check_in" TIME NOT NULL,
    "hora_check_out" TIME NOT NULL,
    "nota_interno" VARCHAR(255) NOT NULL,
    "status" VARCHAR(45) NOT NULL,
    "imovelId" INTEGER NOT NULL,

    CONSTRAINT "Bloqueio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Canal" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(45) NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,

    CONSTRAINT "Canal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agente" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(45) NOT NULL,

    CONSTRAINT "Agente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospedeDaReserva" (
    "id" SERIAL NOT NULL,
    "nomeCompleto" VARCHAR(45) NOT NULL,
    "criadoPor" VARCHAR(45) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL,
    "atualizadoPor" VARCHAR(45) NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "reservaLocalizador" VARCHAR(10) NOT NULL,

    CONSTRAINT "HospedeDaReserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxaDaReserva" (
    "id" SERIAL NOT NULL,
    "taxa" VARCHAR(45) NOT NULL,
    "criado_por" VARCHAR(45) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por" VARCHAR(45) NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "reservaId" INTEGER NOT NULL,

    CONSTRAINT "TaxaDaReserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" SERIAL NOT NULL,
    "localizador" VARCHAR(10) NOT NULL,
    "idAutomacao" INTEGER NOT NULL,
    "criadoPor" VARCHAR(45) NOT NULL,
    "atualizadoPor" VARCHAR(45) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "idExterno" VARCHAR(36) NOT NULL,
    "dataDaCriacao" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "periodoDaReservaInicio" TIMESTAMP(3) NOT NULL,
    "periodoDaReservaFim" TIMESTAMP(3) NOT NULL,
    "horaCheckIn" TIMESTAMP(3) NOT NULL,
    "horaCheckOut" TIMESTAMP(3) NOT NULL,
    "quantidadeHospedes" INTEGER NOT NULL,
    "quantidadeAdultos" INTEGER NOT NULL,
    "quantidadeCriancas" INTEGER NOT NULL,
    "quantidadeInfantil" INTEGER NOT NULL,
    "observacoes" VARCHAR(255) NOT NULL,
    "quantidadeDiarias" INTEGER NOT NULL,
    "partnerCode" VARCHAR(45) NOT NULL,
    "moeda" CHAR(3) NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "totalTaxasExtras" DECIMAL(10,2) NOT NULL,
    "totalPago" DECIMAL(10,2) NOT NULL,
    "pendenteQuitacao" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "chatReserva" VARCHAR(255) NOT NULL,
    "processamentoPg" TEXT NOT NULL,
    "responsavel" VARCHAR(90) NOT NULL,
    "linkStays" VARCHAR(2083) NOT NULL,
    "origem" VARCHAR(45) NOT NULL,
    "nomeDoImovelPersonalizado" VARCHAR(45) NOT NULL,
    "condominio" VARCHAR(45) NOT NULL,
    "regiao" VARCHAR(45) NOT NULL,
    "idImovelStays" VARCHAR(45) NOT NULL,
    "imovelOficialSku" VARCHAR(45) NOT NULL,
    "canaisTitulo" VARCHAR(45) NOT NULL,
    "imovelId" INTEGER NOT NULL,
    "canalId" INTEGER NOT NULL,
    "hospedeDaReservaId" INTEGER NOT NULL,
    "agenteId" INTEGER NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proprietario_cpf_cnpj_key" ON "Proprietario"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Condominio_sku_key" ON "Condominio"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Imovel_sku_key" ON "Imovel"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Bloqueio_localizador_key" ON "Bloqueio"("localizador");

-- AddForeignKey
ALTER TABLE "Imovel" ADD CONSTRAINT "Imovel_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Proprietario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imovel" ADD CONSTRAINT "Imovel_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bloqueio" ADD CONSTRAINT "Bloqueio_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxaDaReserva" ADD CONSTRAINT "TaxaDaReserva_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "Canal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_hospedeDaReservaId_fkey" FOREIGN KEY ("hospedeDaReservaId") REFERENCES "HospedeDaReserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
