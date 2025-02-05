import { sincronizarTudo } from '../../modules/jestor/jestor.service';

(async () => {
    try {
        await sincronizarTudo();
        console.log('Sincronização geral concluída!');
    } catch (error: any) {
        console.error('Erro ao executar a sincronização geral:', error.message);
    }
})();
