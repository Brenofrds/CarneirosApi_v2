import { PrismaClient } from '@prisma/client';
/*--------------------------------------------------
Configuração do client do Prisma
*/

const prisma = new PrismaClient();
export default prisma;