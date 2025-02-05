import { verificarProprietarioNoJestor } from '../../modules/jestor/proprietarios/proprietarios.service';

async function testVerificarProprietario() {
  try {
    const cpf = '222222222-24'; // Substitua pelo CPF a ser testado
    const exists = await verificarProprietarioNoJestor(cpf);
    console.log(`Proprietário com CPF ${cpf} ${exists ? 'existe' : 'não existe'} no Jestor.`);
  } catch (error: any) {
    console.error('Erro no teste:', error.message);
  }
}

testVerificarProprietario();
