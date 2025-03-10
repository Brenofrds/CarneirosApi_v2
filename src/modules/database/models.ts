import prisma from '../../config/database';

/**
 * Atualiza o campo sincronizadoNoJestor para true
 * @param tabela - nome da tabela
 * @param Id - valor do campo usado para encontrar o registro
 * @param nome - nome da taxaReserva ou nome do proprietario
 * @param telefone - telefone do proprietario
 */

export async function atualizaCampoSincronizadoNoJestor(
    tabela: string,
    id: string | number,
    nome?: string,
    telefone?: string
) {
    try{
        let idInt = 0;
        switch(tabela){
            case "agente":
                if (typeof id === 'string') {
                    await prisma.agente.update({
                        where:{idExterno: id},
                        data: {sincronizadoNoJestor: true},
                    });
                }
                break;

            case "hospede":
                if (typeof id === 'string') {
                    await prisma.hospede.update({
                        where:{idExterno: id},
                        data: {sincronizadoNoJestor: true},
                    });
                }
                break;

            case "reserva":
                if (typeof id === 'string') {
                    await prisma.reserva.update({
                        where:{localizador: id},
                        data: {sincronizadoNoJestor: true},
                    });
                }
                break;
            
            case "imovel":
                if (typeof id === 'string') {    
                    await prisma.imovel.update({
                        where:{idExterno: id},
                        data: {sincronizadoNoJestor: true},
                    });
                }
                break;
            
            case "condominio":
                if (typeof id === 'string') {
                    await prisma.condominio.update({
                        where:{idExterno: id},
                        data: {sincronizadoNoJestor: true},
                    });
                }
                break;

            case "taxaReserva":
                if (typeof id === 'number') {
                    await prisma.taxaReserva.update({
                        where:{
                                id: id,
                                name: nome, // nome do campo no banco de dados: NAME
                            },
                        data: {sincronizadoNoJestor: true},
                    });
                }
                break;    

            case "canal":
                if (typeof id === 'string') {
                    await prisma.canal.update({
                        where:{idExterno: id},
                        data:{sincronizadoNoJestor: true},
                    });
                }
                break;
                
            case "bloqueio":
                if (typeof id === 'string') {
                    await prisma.bloqueio.update({
                        where:{idExterno: id},
                        data:{sincronizadoNoJestor: true},
                        });
                }
                break;

            case "proprietario":
                if (typeof id === 'number') {
                    await prisma.proprietario.update({
                        where:{
                                id: id,
                                nome: nome,
                                telefone: telefone,
                            },
                        data:{sincronizadoNoJestor: true},
                        });
                }
                break;

            default:
                throw new Error(`Tabela '${tabela}' não suportada.`);
        }
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
        return false;
    } 
    else {
        return taxasReservas;
    }    
}

/**
 * Busca todos as bloqueios que ainda não foram sincronizados com o Jestor.
 */
export async function getBloqueiosNaoSincronizados() {
    const bloqueios = await prisma.bloqueio.findMany({
        where: {
            sincronizadoNoJestor: false, // Filtra apenas as taxasReservas não sincronizados
        },
    });
    
    // Verifica se existe registro para sincronizar
    if(bloqueios.length === 0){
        console.log("--------------------------------------------------");
        console.log("Todos os bloqueios ja estao sincronizados!");
        return false;
    } 
    else {
        return bloqueios;
    }    
}

/**
 * Busca todos as proprietarios que ainda não foram sincronizados com o Jestor.
 */
export async function getProprietariosNaoSincronizados() {
    const proprietarios = await prisma.proprietario.findMany({
        where: {
            sincronizadoNoJestor: false, // Filtra apenas as taxasReservas não sincronizados
        },
    });
    
    // Verifica se existe registro para sincronizar
    if(proprietarios.length === 0){
        console.log("--------------------------------------------------");
        console.log("Todos as proprietarios ja estao sincronizados!");
        //console.log("--------------------------------------------------");
        return false;
    } 
    else {
        return proprietarios;
    }    
}