import { sincronizarProprietarios } from '../../modules/jestor/proprietarios/proprietarios.service';

async function testSincronizarProprietarios() {
  try {
    await sincronizarProprietarios();
    console.log('Sincronização concluída!');
  } catch (error: any) {
    console.error('Erro ao testar sincronização:', error.message);
  }
}

testSincronizarProprietarios();
