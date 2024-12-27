import axios from 'axios';

const API_TOKEN = 'MmQ4MTk1ZmY5ZGUzYzEzce1c7be307MTY4MDAyNzE0M2UyYzk1'; // Substitua pelo seu token correto
const BASE_URL = 'https://carneirostemporada.api.jestor.com'; // Certifique-se de que este é o domínio correto

const jestorClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    Authorization: `Bearer ${API_TOKEN}`,
  },
});

export default jestorClient;
