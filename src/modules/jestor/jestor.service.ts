import jestorClient from '../../config/jestorClient';
import prisma from '../../config/database';

export async function enviarProprietariosParaJestor() {
    try {
        // Busca os proprietários do banco de dados
        const proprietarios = await prisma.proprietario.findMany();

        for (const proprietario of proprietarios) {
            // Envia cada proprietário para a API do Jestor
            const response = await jestorClient.post('/object/<id-da-sua-tabela>', {
                nome: proprietario.proprietario_principal,
                cpf_cnpj: proprietario.cpf_cnpj,
                email: proprietario.email,
            });
            console.log(`Proprietário enviado: ${response.data}`);
        }
    } catch (error: any) {
        console.error('Erro ao envsasiar proprietários para o Jestor:', error.response?.data || error.message);
    }
}
