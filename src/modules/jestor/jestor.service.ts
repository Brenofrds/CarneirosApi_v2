import { sincronizarAgente } from './services/agentes.service';
import { sincronizarBloqueio } from './services/bloqueios.service';
import { sincronizarCanal } from './services/canais.service';
import { sincronizarCondominio } from './services/condominios.service';
import { sincronizarHospede } from './services/hospedes.service';
import { sincronizarImovel } from './services/imoveis.service';
import { sincronizarProprietario } from './services/proprietarios.service';
import { sincronizarReserva } from './services/reservas.service';
import { sincronizarTaxaReserva } from './services/taxasReservas.service';


export async function sincronizarTudo() {
    try {
        console.log('Iniciando sincronização de agentes...');
        await sincronizarAgente();
        console.log('Sincronização de agentes concluída!');

        console.log('Iniciando sincronização de bloqueios...');
        await sincronizarBloqueio();
        console.log('Sincronização de bloqueios concluída!');

        console.log('Iniciando sincronização de canais...');
        await sincronizarCanal();
        console.log('Sincronização de canais concluída!');

        console.log('Iniciando sincronização de condomínios...');
        await sincronizarCondominio();
        console.log('Sincronização de condomínios concluída!');

        console.log('Iniciando sincronização de hóspedes...');
        await sincronizarHospede();
        console.log('Sincronização de hóspedes concluída!');

        console.log('Iniciando sincronização de imóveis...');
        await sincronizarImovel();
        console.log('Sincronização de imóveis concluída!');

        console.log('Iniciando sincronização de proprietários...');
        await sincronizarProprietario();
        console.log('Sincronização de proprietários concluída!');

        console.log('Iniciando sincronização de reservas...');
        await sincronizarReserva();
        console.log('Sincronização de reservas concluída!');

        console.log('Iniciando sincronização de taxas de reservas...');
        await sincronizarTaxaReserva();
        console.log('Sincronização de taxas de reservas concluída!');
        
    } catch (error: any) {
        console.error('Erro durante a sincronização geral:', error.message);
    }
}