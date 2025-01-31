import { inserirAgenteNoJestor } from '../../modules/jestor/agentes/agentes.service';

async function testInserirAgente() {
    const agenteFicticio = {
        id: 101, // ID fictício
        nome: 'Carlos Souza', // Nome fictício
    };

    try {
        const response = await inserirAgenteNoJestor(agenteFicticio);
        console.log('Teste de inserção bem-sucedido:', response);
    } catch (error: any) {
        console.error('Erro no teste de inserção:', error.message);
    }
}

testInserirAgente();
