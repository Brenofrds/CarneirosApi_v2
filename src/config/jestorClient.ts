import axios from 'axios';

const options = {
  method: 'POST',
  url: 'https://carneirostemporada.api.jestor.com/object/list', // Ajuste o domínio aqui
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    Authorization: 'Bearer MmQ4MTk1ZmY5ZGUzYzEzce1c7be307MTY4MDAyNzE0M2UyYzk1',
  },
  data: {
    object_type: 'a3672133a5950a31442d1', // Substitua pelo ID ou nome real da tabela
    page: 1,
    size: 2, // Quantidade de registros por página
    select: ['telefone'], // Campo que deseja obter
  },
};

axios
  .request(options)
  .then((res) => {
    const { data } = res;
    const telefones = data.data.items.map((item: any) => item.telefone); // Extrai apenas os telefones
    console.log('Telefones:', telefones);
  })
  .catch((err) => {
    console.error('Erro:', err.response?.data || err.message);
  });
