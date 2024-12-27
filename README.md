# Carneiros API Jestor Novo

Este projeto é uma API construída para integrar dados entre a API da **Stays** e a API da **Jestor**, com manipulação e armazenamento de dados em um banco de dados gerenciado pelo Prisma.

---

## **Estrutura do Projeto**

### **Raiz do Projeto**
- **`package.json`**: Lista as dependências do projeto e define scripts para execução.
- **`tsconfig.json`**: Configurações do TypeScript.
- **`.env`**: Arquivo de variáveis de ambiente, onde estão as chaves de API e URLs sensíveis.
- **`README.md`**: Documento explicando a estrutura do projeto.

### **Diretório `prisma/`**
- **`schema.prisma`**: Arquivo que define os modelos e configurações do banco de dados.
- **`migrations/`**: Armazena as migrações geradas pelo Prisma.

### **Diretório `src/`**

#### **Subdiretório `config/`**
Arquivos de configuração e conexão com APIs externas:
- **`database.ts`**: Configuração do Prisma Client para conexão com o banco de dados.
- **`staysClient.ts`**: Configuração do cliente Axios para a API da Stays.
- **`jestorClient.ts`**: Configuração do cliente Axios para a API do Jestor.

#### **Subdiretório `modules/`**
Cada módulo contém controladores, serviços e tipos específicos:
- **`stays/`**:
  - **`stays.controller.ts`**: Gerencia as requisições HTTP relacionadas à Stays.
  - **`stays.service.ts`**: Contém a lógica de interação com a API da Stays.
  - **`stays.types.ts`**: Define as interfaces e tipos utilizados no módulo.
- **`jestor/`**:
  - **`jestor.controller.ts`**: Gerencia as requisições HTTP relacionadas à Jestor.
  - **`jestor.service.ts`**: Contém a lógica de interação com a API da Jestor.
  - **`jestor.types.ts`**: Define as interfaces e tipos utilizados no módulo.

#### **Subdiretório `utils/`**
- **`dataTransform.ts`**: Funções para transformação de dados.

#### **Arquivos de Entrada**
- **`app.ts`**: Configura e inicializa o servidor Express.
- **`index.ts`**: Ponto de entrada do projeto.

---

## **Fluxo de Funcionamento**

1. **Conexão com APIs**:
   - **Stays**: O cliente `staysClient.ts` realiza requisições à API da Stays.
   - **Jestor**: O cliente `jestorClient.ts` se comunica com a API da Jestor.

2. **Requisições para a API da Stays**:
   - O controlador `stays.controller.ts` chama funções do serviço `stays.service.ts` para buscar reservas ou outros dados necessários.

3. **Envio de Dados para a API da Jestor**:
   - Dados tratados são enviados à Jestor utilizando o módulo Jestor (`jestor.controller.ts` e `jestor.service.ts`).

4. **Transformação de Dados**:
   - Dados são tratados e preparados para envio ou armazenamento usando utilitários (`dataTransform.ts`).

---

## **Como Rodar o Projeto**

1. **Clone o Repositório**:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd Carneiros-API-Jestor-Novo
