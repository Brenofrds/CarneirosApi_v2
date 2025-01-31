import { sincronizarProprietarios } from './proprietarios/proprietarios.service';
import { sincronizarAgentes } from './agentes/agentes.service';

export async function sincronizarTudo() {
    try {
        console.log('Iniciando sincronização de proprietários...');
        await sincronizarProprietarios();
        console.log('Sincronização de proprietários concluída!');

        console.log('Iniciando sincronização de agentes...');
        await sincronizarAgentes();
        console.log('Sincronização de agentes concluída!');
    } catch (error: any) {
        console.error('Erro durante a sincronização geral:', error.message);
    }
}
