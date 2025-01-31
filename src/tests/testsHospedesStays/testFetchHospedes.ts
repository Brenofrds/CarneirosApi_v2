import { fetchHospedes } from '../../modules/stays/stays.service';

async function testFetchHospedes() {
  try {
    const skip = 0; // Substitua pelo valor de paginação desejado
    const limit = 2; // Número de registros a serem buscados
    console.log(`Buscando hóspedes com skip=${skip} e limit=${limit}...`);
    await fetchHospedes(skip, limit);
  } catch (error: any) {
    console.error('Erro no teste:', error.message);
  }
}

testFetchHospedes();
