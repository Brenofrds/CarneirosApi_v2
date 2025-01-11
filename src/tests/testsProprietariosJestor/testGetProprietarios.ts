import { getProprietariosNaoSincronizados } from '../../modules/database/models';

(async () => {
  const proprietarios = await getProprietariosNaoSincronizados();
})();
