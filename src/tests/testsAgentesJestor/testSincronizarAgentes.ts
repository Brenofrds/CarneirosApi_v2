import { sincronizarAgentes } from '../../modules/jestor/agentes/agentes.service';

async function testSincronizarAgentes() {
  try {
    await sincronizarAgentes();
    console.log('Sincronização concluída!');
  } catch (error: any) {
    console.error('Erro ao testar sincronização:', error.message);
  }
}

testSincronizarAgentes();
