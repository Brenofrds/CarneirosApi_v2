import jestorClient from '../../../config/jestorClient';
import prisma from '../../../config/database';
import { getAgentesNaoSincronizados } from '../../database/models';

/**
 * Verifica se um agente com o nome fornecido já existe na tabela do Jestor.
 * @param nome - Nome do agente a ser verificado.
 * @returns - Um boolean indicando se o agente já existe no Jestor.
 */
export async function verificarAgenteNoJestor(nome: string) {
    try {
        const response = await jestorClient.post('/object/list', {
            object_type: '1jxekmijxza61ygtgadfi', // ID da tabela no Jestor
            filters: [
                {
                    field: 'name', // Nome do campo no Jestor
                    value: nome,
                    operator: '==', // Operador para comparação
                },
            ],
        });

        console.log('Resposta da API do Jestor:', JSON.stringify(response.data, null, 2));

        // Garante que items está definido antes de verificar o tamanho
        const items = response.data?.data?.items;

        if (Array.isArray(items) && items.length > 0) {
            return true; // Agente existe
        }

        return false; // Agente não existe
    } catch (error: any) {
        console.error('Erro ao verificar agente no Jestor:', error.message);
        throw new Error('Erro ao verificar agente no Jestor');
    }
}

/**
 * Insere um agente no Jestor.
 * @param agente - Dados do agente a serem inseridos.
 */
export async function inserirAgenteNoJestor(agente: {
    id: number;
    nome: string;
}) {
    try {
        const response = await jestorClient.post('/object/create', {
            object_type: '1jxekmijxza61ygtgadfi', // ID da tabela no Jestor
            data: {
                id_api_engnet: agente.id, // ID do banco da API EngNet
                name: agente.nome, // Nome do agente
            },
        });

        console.log('Agente inserido no Jestor:', response.data);
        return response.data; // Retorna o dado inserido
    } catch (error: any) {
        console.error('Erro ao inserir agente no Jestor:', error.response?.data || error.message);
        throw new Error('Erro ao inserir agente no Jestor');
    }
}

/**
 * Sincroniza os agentes não sincronizados do banco local com o Jestor.
 */
export async function sincronizarAgentes() {
    try {
        const agentesNaoSincronizados = await getAgentesNaoSincronizados();

        for (const agente of agentesNaoSincronizados) {
            const existeNoJestor = await verificarAgenteNoJestor(agente.nome);

            if (!existeNoJestor) {
                const registroJestor = await inserirAgenteNoJestor({
                    id: agente.id, // ID do banco local
                    nome: agente.nome,
                });

                // Atualiza o status no banco local
                await prisma.agente.update({
                    where: { id: agente.id },
                    data: { sincronizadoNoJestor: true },
                });

                console.log(`Agente ${agente.nome} sincronizado com sucesso!`);
            } else {
                // Se já existe no Jestor, atualiza o status no banco local para sincronizado
                await prisma.agente.update({
                    where: { id: agente.id },
                    data: { sincronizadoNoJestor: true },
                });

                console.log(`Agente ${agente.nome} já existe no Jestor e foi atualizado no banco local.`);
            }
        }
    } catch (error: any) {
        console.error('Erro ao sincronizar agentes:', error.message);
    }
}
