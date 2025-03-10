import prisma from '../config/database';
import { registrarErro } from '../modules/database/erro.service';

/*
type SincronizarFuncao<T> = (dado: T) => Promise<void>;

// 🛠️ Mapeamento explícito entre o tipo e o cliente Prisma correto
const prismaModelMap = {
    reserva: prisma.reserva,
    imovel: prisma.imovel,
    hospede: prisma.hospede,
    condominio: prisma.condominio,
    taxaReserva: prisma.taxaReserva,
    bloqueio: prisma.bloqueio,
    proprietario: prisma.proprietario,
    agente: prisma.agente,
    canal: prisma.canal,
};

// 🚀 Função genérica para sincronização e registro de erro
export async function sincronizarERegistrarErro<T>(
dado: T & { id: number },
tipo: PrismaModel,
sincronizarFuncao: SincronizarFuncao<T>
) {
try {
    // 🚀 Tenta sincronizar o dado com o Jestor
    await sincronizarFuncao(dado);

    // ✅ Se deu certo, atualiza o campo `sincronizadoNoJestor`
    const prismaModel = prismaModelMap[tipo];
    await prismaModel.update({
    where: { id: dado.id },
    data: { sincronizadoNoJestor: true },
    });

    console.log(`✅ ${tipo} sincronizado com sucesso no Jestor!`);
} catch (error: any) {
    console.error(`❌ Erro ao sincronizar ${tipo} com o Jestor:`, error.message);

    // 🔥 Registra o erro na tabela `ErroSincronizacao`
    await registrarErro(tipo, dado.id.toString(), error.message);
}
}
*/
