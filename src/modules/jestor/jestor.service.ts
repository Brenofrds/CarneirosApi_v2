import jestorClient from '../../config/jestorClient';

export async function fetchTelefones(page: number = 1, size: number = 10): Promise<string[]> {
  try {
    const response = await jestorClient.post('/object/list', {
      object_type: 'a3672133a5950a31442d1', // ID ou nome da tabela
      page,
      size,
      select: ['telefone'], // Campo desejado
    });

    const telefones = response.data.data.items.map((item: any) => item.telefone); // Extrai apenas os telefones
    return telefones;
  } catch (error: any) {
    console.error('Erro ao buscar telefones:', error.response?.data || error.message);
    throw new Error('Falha ao buscar telefones');
  }
}

//Cria um registro novo na tabela do Jestor
export async function jestorCreateRecord(data: any) {
  try{
    const response = await jestorClient.post('/object/create', {
        object_type: 'yhe66m7287os9_0xq_kbu',//tabela testEngNet_1
        data: {
          cpf_1: data.cpf_cnpj,
          nome: data.proprietario_principal,
          email: data.email
        },
      });
  }
  catch(error: any){
    console.error('Erro ao criar registro no Jestor', error.response?.data || error.message);
    throw new Error('Falha ao criar registro');
  }
}

/*
async function main() {
    
    const telefones = await fetchTelefones(1, 10); // Busca telefones na página 1 com 10 registros
    console.log('Telefones encontrados:', telefones);
}
  
main();
*/