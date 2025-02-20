import prisma from '../../config/database';

/**
 * Atualiza o campo sincronizadoNoJestor para true
 * @param tabela - nome da tabela
 * @param Id - valor do campo usado para encontrar o registro
 */
export async function atualizaCampoSincronizadoNoJestor(
    tabela: string | number,
    id: string,
    nome?: string
) {
    try{
        switch(tabela){
            case "agente":
                await prisma.agente.update({
                    where:{idExterno: id},
                    data: {sincronizadoNoJestor: true},
                });
                break;

            case "hospede":
                await prisma.hospede.update({
                    where:{idExterno: id},
                    data: {sincronizadoNoJestor: true},
                });
                break;

            case "reserva":
                await prisma.reserva.update({
                    where:{localizador: id},
                    data: {sincronizadoNoJestor: true},
                });
                break;
            
            case "imovel":
                await prisma.imovel.update({
                    where:{idExterno: id},
                    data: {sincronizadoNoJestor: true},
                });
                break;
            
            case "condominio":
                await prisma.condominio.update({
                    where:{idExterno: id},
                    data: {sincronizadoNoJestor: true},
                });
                break;
            case "taxaReserva":
                const idStr = parseInt(id);// transforma id em string
                await prisma.taxaReserva.update({
                    where:{
                            id: idStr,
                            name: nome,
                        },
                    data: {sincronizadoNoJestor: true},
                });
                break;    

            case "canal":
                await prisma.canal.update({
                    where:{idExterno: id},
                    data:{sincronizadoNoJestor: true},
                });
                break;

            default:
                throw new Error(`Tabela '${tabela}' não suportada.`);
        }
        
        console.log("--------------------------------------------------");
        console.log("Registro atualizado no banco de dados com sucesso!");
        //console.log("--------------------------------------------------");   
    } catch (error: any){
        console.error(`Erro ao atualizar registro na '${tabela}':`, error.message);
    }
}


/**
 * Busca todos os agentes que ainda não foram sincronizados com o Jestor.
 */
export async function getAgentesNaoSincronizados() {
    const agentes = await prisma.agente.findMany({
        where: {
            sincronizadoNoJestor: false, // Filtra apenas os agentes não sincronizados
        },
    });
    
    // Verifica se existe registro para sincronizar
    if(agentes.length === 0){
        console.log("--------------------------------------------------");
        console.log("Todos os agentes ja estao sincronizados!");
        //console.log("--------------------------------------------------");
        return false;
    } 
    else {
        return agentes;
    }    
}

/**
 * Busca todos os hospedes que ainda não foram sincronizados com o Jestor.
 */
export async function getHospedesNaoSincronizados() {
    const hospede = await prisma.hospede.findMany({
        where: {
            sincronizadoNoJestor: false, // Filtra apenas os agentes não sincronizados
        },
    });
    
    // Verifica se existe registro para sincronizar
    if(hospede.length === 0){
        console.log("--------------------------------------------------");
        console.log("Todos os hospedes ja estao sincronizados!");
        //console.log("--------------------------------------------------");
        return false;
    } 
    else {
        return hospede;
    }    
}

/**
 * Busca todos as reservas que ainda não foram sincronizados com o Jestor.
 */
export async function getReservasNaoSincronizados() {
    const reserva = await prisma.reserva.findMany({
        where: {
            sincronizadoNoJestor: false, // Filtra apenas as reservas não sincronizados
        },
    });
    
    // Verifica se existe registro para sincronizar
    if(reserva.length === 0){
        console.log("--------------------------------------------------");
        console.log("Todos as reservas ja estao sincronizados!");
        //console.log("--------------------------------------------------");
        return false;
    } 
    else {
        return reserva;
    }    
}

/**
 * Busca todos os canais que ainda não foram sincronizados com o Jestor.
 */
export async function getCanaisNaoSincronizados() {
    const canais = await prisma.canal.findMany({
        where: {
            sincronizadoNoJestor: false, // Filtra apenas os canais não sincronizados
        },
    });

    // Verifica se existe registro para sincronizar
    if (canais.length === 0) {
        console.log("--------------------------------------------------");
        console.log("Todos os canais já estão sincronizados!");
        return false;
    } 
    return canais;
}

/**
 * Busca todos os imóveis que ainda não foram sincronizados com o Jestor.
 */
export async function getImoveisNaoSincronizados() {
    const imoveis = await prisma.imovel.findMany({
        where: {
            sincronizadoNoJestor: false, // Filtra apenas os imóveis não sincronizados
        },
    });

    // Verifica se existe registro para sincronizar
    if (imoveis.length === 0) {
        console.log("--------------------------------------------------");
        console.log("Todos os imóveis já estão sincronizados!");
        return false;
    } 
    return imoveis;
}


/**
 * Busca todos os condominios que ainda não foram sincronizados com o Jestor.
 */
export async function getCondominiosNaoSincronizados() {
    const condominios = await prisma.condominio.findMany({
        where: {
            sincronizadoNoJestor: false, // Filtra apenas os agentes não sincronizados
        },
    });
    
    // Verifica se existe registro para sincronizar
    if(condominios.length === 0){
        console.log("--------------------------------------------------");
        console.log("Todos os condominios ja estao sincronizados!");
        //console.log("--------------------------------------------------");
        return false;
    } 
    else {
        return condominios;
    }    
}

/**
 * Busca todos as taxasReservas que ainda não foram sincronizados com o Jestor.
 */
export async function getTaxasReservasNaoSincronizados() {
    const taxasReservas = await prisma.taxaReserva.findMany({
        where: {
            sincronizadoNoJestor: false, // Filtra apenas as taxasReservas não sincronizados
        },
    });
    
    // Verifica se existe registro para sincronizar
    if(taxasReservas.length === 0){
        console.log("--------------------------------------------------");
        console.log("Todos as taxasReservas ja estao sincronizados!");
        //console.log("--------------------------------------------------");
        return false;
    } 
    else {
        return taxasReservas;
    }    
}