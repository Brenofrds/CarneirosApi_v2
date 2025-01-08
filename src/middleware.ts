import prisma from './config/database';
import { jestorCreateRecord } from './modules/jestor/jestor.service';


/*--------------------------------------------------
Intercepta a criação de um novo registro e chama a 
função que envia esse novo registro ao Jestor

Essa função precisa se importada na rota que puxa os
dados Stay para o nosso banco de dados, que aí será
usado a action==='create'
*/
prisma.$use(async(params, next)=>{
    if(params.model==='Proprietario' && params.action==='create'){
        const result =await next(params);
        await jestorCreateRecord(result);
        return result;
    }
    //return next(params);
})