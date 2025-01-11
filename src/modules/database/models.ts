import prisma from '../../config/database';

/**
 * Busca todos os proprietários que ainda não foram sincronizados com o Jestor.
 */
export async function getProprietariosNaoSincronizados() {
    const proprietarios = await prisma.proprietario.findMany({
        where: {
            sincronizadoNoJestor: false as any, // "as any" contorna o erro temporariamente
        },
    });
  
    return proprietarios;
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
  
    return agentes;
}
  
