/*--------------------------------------------------
CORRESPONDENCIAS: table <> response

*/

// Tabela de correspondência entre os campos do banco de dados e os atributos da resposta
export const correspReserva = {
    //--------------------------------------------------
    idReserva: "_id", // ID reserva
    localizador: "id", // ID reserva
    dataDaCriacao: "creationDate",
    checkInData: "checkInDate",
    checkInHora: "checkInTime",
    checkOutData: "checkOutDate",
    checkOutHora: "checkOutTime",
    //--------------------------------------------------
    idImovelStays: "_idlisting",
    //--------------------------------------------------
    idHospede: "_idclient",
    //--------------------------------------------------
    status: "type",
    //--------------------------------------------------
    agenteId: "agent._id",
    agenteNome: "agent.name",
    //--------------------------------------------------
    moeda: "price.currency",
    valorTotal: "price._f_total",
    totalPago: "stats._f_totalPaid",
    //--------------------------------------------------
    quantidadeHospedes: "guests",
    quantidadeAdultos: "guestsDetails.adults",
    quantidadeCriancas: "guestsDetails.children",
    quantidadeInfantil: "guestsDetails.infants",
    //--------------------------------------------------
    partnerCode: "partnerCode",
    linkStays: "reservationUrl",
    canaisTitulo: "partner.name",
    origem: "partner.name", // Se houver necessidade de usar o nome do parceiro
  };