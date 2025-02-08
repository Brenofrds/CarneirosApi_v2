import prisma from '../../config/database';

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
        console.log("Todos os agentes ja estao sincronizados!");
        return false;
    } 
    else {
        return agentes;
    }    
}

/**
 * Busca todos os agentes que ainda não foram sincronizados com o Jestor.
 */
export async function getHospedesNaoSincronizados() {
    const hospede = await prisma.hospede.findMany({
        where: {
            sincronizadoNoJestor: false, // Filtra apenas os agentes não sincronizados
        },
    });
    
    // Verifica se existe registro para sincronizar
    if(hospede.length === 0){
        console.log("Todos os hospedes ja estao sincronizados!");
        return false;
    } 
    else {
        return hospede;
    }    
}

/**
 * Busca todos os proprietários que ainda não foram sincronizados com o Jestor.
 /
export async function getProprietariosNaoSincronizados() {
    const proprietarios = await prisma.proprietario.findMany({
        where: {
            sincronizadoNoJestor: false as any, // "as any" contorna o erro temporariamente
        },
    });
  
    return proprietarios;
}
*/


  
