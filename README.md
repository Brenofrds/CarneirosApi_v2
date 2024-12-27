# Carneiros API Jestor Novo

Este projeto é uma API desenvolvida para integrar dados entre a API da **Stays** e a API da **Jestor**, com manipulação e armazenamento de informações em um banco de dados gerenciado pelo Prisma.

---

## **Estrutura do Projeto**

### **Raiz do Projeto**
- **`package.json`**: Lista as dependências do projeto e define scripts para execução.
- **`tsconfig.json`**: Configurações do TypeScript.
- **`.env`**: Arquivo de variáveis de ambiente, onde estão armazenadas as chaves de API, URLs sensíveis e outras configurações.
- **`README.md`**: Documento explicativo da estrutura do projeto.

---

### **Diretório `prisma/`**
- **`schema.prisma`**: Define os modelos de dados e configurações do banco de dados usado pelo Prisma.
- **`migrations/`**: Armazena as migrações geradas pelo Prisma para manter o banco de dados sincronizado com os modelos definidos.

---

### **Diretório `src/`**

#### **Subdiretório `config/`**
Armazena arquivos de configuração e conexão com serviços externos:
- **`database.ts`**: Configuração do Prisma Client para gerenciar a conexão com o banco de dados.
- **`staysClient.ts`**: Configuração do cliente Axios para realizar requisições à API da Stays.
- **`jestorClient.ts`**: Configuração do cliente Axios para realizar requisições à API da Jestor.

---

#### **Subdiretório `modules/`**
Cada módulo contém controladores, serviços e tipos específicos:

- **`database/`**:
  - **`models.ts`**: Define modelos e estruturas de dados internos do projeto.
  - **`seed.ts`**: Script para popular o banco de dados com dados iniciais (seed).

- **`stays/`**:
  - **`stays.controller.ts`**: Gerencia as requisições HTTP relacionadas à API da Stays.
  - **`stays.service.ts`**: Contém a lógica de interação com a API da Stays, como busca de dados.
  - **`stays.types.ts`**: Define interfaces e tipos usados no módulo Stays.

- **`jestor/`**:
  - **`jestor.controller.ts`**: Gerencia as requisições HTTP relacionadas à API da Jestor.
  - **`jestor.service.ts`**: Contém a lógica de interação com a API da Jestor, como envio de dados tratados.
  - **`jestor.types.ts`**: Define interfaces e tipos usados no módulo Jestor.

---

#### **Subdiretório `utils/`**
- **`dataTransform.ts`**: Contém funções utilitárias para transformação de dados entre formatos, utilizados na integração entre APIs.

---

#### **Subdiretório `tests/`**
- Reservado para testes automatizados do projeto (atualmente vazio).

---

#### **Arquivos de Entrada**
- **`app.ts`**: Configura e inicializa o servidor Express e os middlewares principais.
- **`index.ts`**: Ponto de entrada do projeto, responsável por inicializar o servidor.

---

## **Fluxo de Funcionamento**

1. **Conexão com APIs**:
   - **Stays**: O cliente `staysClient.ts` realiza requisições à API da Stays para obter dados como reservas e imóveis.
   - **Jestor**: O cliente `jestorClient.ts` envia os dados tratados para a API da Jestor.

2. **Requisições para a API da Stays**:
   - O controlador `stays.controller.ts` chama funções do serviço `stays.service.ts` para buscar reservas e outros dados relevantes.

3. **Envio de Dados para a API da Jestor**:
   - Dados tratados são enviados para a API da Jestor utilizando o módulo Jestor (`jestor.controller.ts` e `jestor.service.ts`).

4. **Transformação de Dados**:
   - Os dados coletados são transformados para o formato esperado antes de serem enviados ou armazenados no banco de dados. Essas transformações ocorrem em `dataTransform.ts`.

---

## **Como Rodar o Projeto**

1. **Clone o Repositório**:
   ```bash
   git clone https://github.com/Brenofrds/CarneirosApi_v2.git
   cd CarneirosApi_v2
