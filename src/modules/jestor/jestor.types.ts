
export interface typeAgente {
    id: number;
    idExterno: string;
    nome: string;
    jestorId: number | null; // <- agora o campo opcional está aqui!
  }
  

// Tipo para os atributos da tabela de hospede no banco de dados
export interface typeHospede{
    id: number;
    idExterno: string;
    nomeCompleto: string;
    email: string | null;
    dataDeNascimento: string | null;
    idade: number | null;
    telefone: string | null;
    cpf: string | null;
    documento: string | null;
    reservaId: number;
}

// Tipo para os atributos da tabela de reserva no banco de dados
export interface typeReserva {
  id: number;
  localizador: string;
  idExterno: string;
  dataDaCriacao: string;
  checkIn: string;
  horaCheckIn?: string | null;
  checkOut: string;
  horaCheckOut?: string | null;
  quantidadeHospedes?: number | null;
  quantidadeAdultos?: number | null;
  quantidadeCriancas?: number | null;
  quantidadeInfantil?: number | null;
  moeda?: string | null;
  valorTotal: number;
  totalPago: number;
  pendenteQuitacao: number;
  totalTaxasExtras: number;
  quantidadeDiarias: number;
  partnerCode?: string | null;
  linkStays: string;
  idImovelStays: string;
  origem: string;
  status: string;
  condominio: string;
  regiao: string;
  imovelOficialSku: string;
  observacao?: string | null;
  jestorId?: number | null;
  imovelId?: number | null;
  canalId?: number | null;
  agenteId?: number | null;
  imovelIdJestor?: number | null;
}

// Tipo para os atributos da tabela de canal no banco de dados
export interface typeCanal {
    id: number;
    idExterno: string;
    titulo: string;
    jestorId: number | null;
}

// Tipo para os atributos da tabela de imóvel no banco de dados
export interface typeImovel {
    id: number;
    idExterno: string;
    idStays: string;
    sku: string | null;
    status: string;
    idCondominioStays: string | null;
    proprietarioId: number | null;
    jestorId: number | null; // ✅ Adicionado para refletir corretamente o banco de dados
    regiao: string | null;
}

// Tipo para os atributos da tabela de condomínio no banco de dados
export interface typeCondominio {
    id: number;
    idExterno: string;
    idStays: string;
    sku: string;
    regiao: string;
    titulo: string | null;
    status: string | null;
    jestorId: number | null; 
  }

// Tipo para os atributos da tabela de taxaReserva no banco de dados
export interface typeTaxaReserva {
    id: number;
    reservaId: number;
    name: string;
    valor: number;
}

// Tipo para os atributos da tabela de bloqueio no banco de dados
export interface typeBloqueio {
    id: number;
    idExterno: string;
    localizador: string;
    checkIn: string;
    checkOut: string;
    horaCheckIn: string | null;
    horaCheckOut: string | null;
    notaInterna: string | null;
    imovelId: number | null;
    status: string | null;
    jestorId: number | null;
}

// Tipo para os atributos da tabela de proprietario no banco de dados
export interface typeProprietario {
    id: number;
    nome: string;
    telefone: string | null;
    jestorId: number | null;
}