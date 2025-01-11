import express from 'express';
//import { jestorCreateRecord } from './modules/jestor/jestor.service';
import { jestorFetchRecord } from './modules/jestor/jestor.service';
import prisma from './config/database';
//import './middleware';//importa e executa o middleware

const app = express();
app.use(express.json());


/*--------------------------------------------------
Inserir as rotas para o BANCO DE DADOS
*/
//import jestorRouteDB from "./src/modules/jestor/jestor.route.db.js";
//app.use("/jestorDB", jestorRouteDB);

/*--------------------------------------------------
ROTA: consulta todos os registros da tabela proprie-
tarios
/*
app.get('/jestorDB', async (req, res)=>{
    const proprietario1 = await prisma.proprietario.findMany();
    console.log(proprietario1);
    res.status(200).json(proprietario1);
})
*/

/*--------------------------------------------------
ROTA: consulta apenas um registro da tabela proprie-
tarios

app.get('/jestorDB', async(req, res)=>{
    const a = await prisma.proprietario.findUnique({
        where: {
            id: 3,
        },
    })
    /* 
    "res.status(200).json(a);":
    Se não tiver essa linha o 'client' (ThunderClient ou 
    Portman ou PrismaStudio) não recebe os dados que fo-
    ram retornados na variavel a. Ou seja, não vai dar 
    pra ver a comunicação acontecendo.
     *
    res.status(200).json(a);
    console.log(a);

    if(a){
        //await jestorCreateRecord(a);
        await jestorFetchRecord(a);
    }
});
*/

/*--------------------------------------------------
ROTA: consulta um registro da tabela no jestor pelo
CPF informado
*/
app.get('/jestorDB', async(req, res)=>{
    const a = await prisma.proprietario.findUnique({
        where: {
            cpf_cnpj: '222222222-11',
        },
    })
    res.status(200).json(a);
    console.log(a);

    if(a){
        await jestorFetchRecord(a);
    }
});

/*--------------------------------------------------
Para 'escutar' o servidor do banco de dados
*/
app.listen(3000, ()=>{
    console.log("Servidor do jestorDB rodando...");
})

