import { inserirProprietarioNoJestor } from '../../modules/jestor/proprietarios/proprietarios.service';

async function testInserirProprietario() {
    const proprietarioFicticio = {
        cpf_cnpj: '444444444-44', // CPF fictício
        proprietario_principal: 'Ana Silva', // Nome fictício
        email: 'ana.silva@example.com', // Email fictício
    };

    try {
        const response = await inserirProprietarioNoJestor(proprietarioFicticio);
        console.log('Teste de inserção bem-sucedido:', response);
    } catch (error: any) {
        console.error('Erro no teste de inserção:', error.message);
    }
}

testInserirProprietario();
