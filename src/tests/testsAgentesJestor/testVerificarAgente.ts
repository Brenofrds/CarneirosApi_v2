import { verificarAgenteNoJestor } from '../../modules/jestor/agentes/agentes.service';

async function testVerificarAgente() {
  try {
    const nome = 'Carlos Souza'; // Substitua pelo nome do agente a ser testado
    const exists = await verificarAgenteNoJestor(nome);
    console.log(`Agente com nome "${nome}" ${exists ? 'existe' : 'não existe'} no Jestor.`);
  } catch (error: any) {
    console.error('Erro no teste:', error.message);
  }
}

testVerificarAgente();
