/*--------------------------------------------------
Configuração da conexão base com o Jestor
Importação do axios
*/
import axios from 'axios';

const API_TOKEN = 'YzIwMTJhODljOGUyNjc41064b2d938MTcwNjc0MjU5NWU1YmE3'; // Substitua pelo seu token correto
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
