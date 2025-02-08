import jestorClient from '../../../config/jestorClient';
import prisma from '../../../config/database';
import { getHospedesNaoSincronizados } from '../../database/models';

const ENDPOINT_LIST = '/object/list';
const ENDPOINT_CREATE = '/object/create';
const JESTOR_HOSPEDE = 'b_d6pu1giq_jb0gd7f0ed';

/**
 * Verifica se um hospede com o nome fornecido já existe na tabela do Jestor.
 * @param - Nome/CPF/ReservaId do hospede a ser verificado.
 * @returns - Um boolean indicando se o hospede já existe no Jestor.
 */

export async function verificarHospedesNoJestor(nome: string, idExterno: string | null, reservaId: number) {
    try {
        const response = await jestorClient.post(ENDPOINT_LIST, {
            object_type: JESTOR_HOSPEDE, // ID da tabela no Jestor
            filters: [
                        {
                            field: 'nomecompleto', // Nome do campo no Jestor
                            value: nome,
                            operator: '==', // Operador para comparação
                        },
                        {
                            field: 'idexterno',
                            value: idExterno,
                            operator: '==',
                        },
                        {
                            field: 'id_reserva',
                            value: reservaId,
                            operator: '==', 
                        },
            ],
        });

        // Garante que items está definido antes de verificar o tamanho
        const items = response.data?.data?.items;
        
        console.log("--------------------------------------------------");
        console.log('Resposta da API do Jestor:\n\n', JSON.stringify(response.data, null, 2));
        console.log("--------------------------------------------------");
        
        if (Array.isArray(items) && items.length > 0) {
            return true; // Hospede existe
        }

        return false; // Hospede não existe
    } catch (error: any) {
        console.error('Erro ao verificar hospede no Jestor:', error.message);
        throw new Error('Erro ao verificar hospede no Jestor');
    }
}

/**
 * Insere um hospede no Jestor.
 * @param hospede - Dados do hospede a serem inseridos.
 */
export async function inserirHospedesNoJestor(hospede: {
    id: number;
    idExterno: string;
    nomeCompleto: string;
    email: string | null;
    dataDeNascimento: string | null;
    telefone: string | null;
    cpf: string | null;
    documento: string | null;
    reservaId: number;
}) {
    try {
        const response = await jestorClient.post(ENDPOINT_CREATE, {
            object_type: JESTOR_HOSPEDE, // ID da tabela no Jestor
            data: {
                // nome do campo no Jestor | nome do campo no banco de dados local
                name: hospede.id, // ID do banco da API EngNet
                idexterno: hospede.idExterno,
                nomecompleto: hospede.nomeCompleto,
                email: hospede.email,
                datanascimento: hospede.dataDeNascimento,
                telefone: hospede.telefone,
                cpf: hospede.cpf,
                documento: hospede.documento,
                id_reserva: hospede.reservaId,
            },
        });

        console.log("--------------------------------------------------");
        console.log('Hospede inserido no Jestor:\n\n', response.data);
        console.log("--------------------------------------------------");
        return response.data; // Retorna o dado inserido
    } catch (error: any) {
        console.error('Erro ao inserir hospede no Jestor:', error.response?.data || error.message);
        throw new Error('Erro ao inserir hospede no Jestor');
    }
}

/**
 * Sincroniza os hospedes não sincronizados do banco local com o Jestor.
 */
export async function sincronizarHospedes() {
    try {
        const hospedesNaoSincronizados = await getHospedesNaoSincronizados();

        if(hospedesNaoSincronizados){
            for (const hospede of hospedesNaoSincronizados) {
                const existeNoJestor = await verificarHospedesNoJestor(hospede.nomeCompleto, hospede.idExterno, hospede.reservaId);
       
                if (!existeNoJestor) {
                    await inserirHospedesNoJestor({
                        id: hospede.id, // ID do banco da API EngNet
                        idExterno: hospede.idExterno,
                        nomeCompleto: hospede.nomeCompleto,
                        email: hospede.email,
                        dataDeNascimento: hospede.dataDeNascimento,
                        telefone: hospede.telefone,
                        cpf: hospede.cpf,
                        documento: hospede.documento,
                        reservaId: hospede.reservaId,
                    });

                    // Atualiza o status no banco local
                    await prisma.hospede.update({
                        where: { id: hospede.id },
                        data: { sincronizadoNoJestor: true },
                    });
                    
                    console.log("--------------------------------------------------");    
                    console.log(`Hospede: ${hospede.nomeCompleto}\nSincronizado com sucesso!`);
                    console.log("--------------------------------------------------");
                } else {
                    // Se já existe no Jestor, atualiza o status no banco local para sincronizado
                    await prisma.hospede.update({
                        where: { id: hospede.id },
                        data: { sincronizadoNoJestor: true },
                    });
                    console.log("--------------------------------------------------");    
                    console.log(`Hospede: ${hospede.nomeCompleto}\nJa existe no Jestor. Atualizado no banco local.`);
                    console.log("--------------------------------------------------");
                }
            }
        }
    } catch (error: any) {
        console.error('Erro ao sincronizar hospede:', error.message);
    }
}

/*funcao de teste*/
(async () => {
  await sincronizarHospedes();
})();


/** Usar esse codigo se precisar fazer filtro por algum campo que
 * pode estar nulo.
 * 
 * Se idExterno for null, pode estar causando problemas no filtro.
 * Tente remover esse filtro quando idExterno for null:
------------------------------------------------------------------

const filters: any[] = [
    { field: 'nomecompleto', value: nome, operator: '==' },
    { field: 'id_reserva', value: reservaId, operator: '==' }
];

if (idExterno) { 
    filters.push({ field: 'idexterno', value: idExterno, operator: '==' });
}

const response = await jestorClient.post(ENDPOINT_LIST, {
    object_type: JESTOR_HOSPEDE,
    filters
});
*/