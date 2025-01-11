import { getAgentesNaoSincronizados } from '../../modules/database/models';

(async () => {
  const agentes = await getAgentesNaoSincronizados();
  console.log('Agentes não sincronizados:', agentes);
})();