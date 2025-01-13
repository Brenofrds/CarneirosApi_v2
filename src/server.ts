/*--------------------------------------------------
Função: Arquivo responsável por rodar o servidor. 
Aqui você importa o app.ts e inicia o servidor na 
porta definida.

Conteúdo: Inicialização do servidor Express.
*/

//codigo exemplo
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
