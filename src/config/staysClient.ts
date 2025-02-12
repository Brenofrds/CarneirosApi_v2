import axios from 'axios';

const AUTH_HEADER = 'Basic ZDkwNDg2YzU6YjU4MTM0M2U=';
const BASE_URL = 'https://cta.stays.com.br/external/v1';

const staysClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    accept: 'application/json',
    Authorization: AUTH_HEADER,
  },
});

export default staysClient;
