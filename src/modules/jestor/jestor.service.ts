import {    
    sincronizarAgentes,
    sincronizarBloqueios,
    sincronizarCanais,
    sincronizarCondominios,
    sincronizarHospedes,
    sincronizarImoveis,
    sincronizarProprietarios,
    sincronizarReservas,
    sincronizarTaxasReservas
} from './services/agentes.service';

export async function sincronizarTudo() {
    try {
        console.log('Iniciando sincronização de agentes...');
        await sincronizarAgentes();
        console.log('Sincronização de agentes concluída!');

        console.log('Iniciando sincronização de bloqueios...');
        await sincronizarBloqueios();
        console.log('Sincronização de bloqueios concluída!');

        console.log('Iniciando sincronização de canais...');
        await sincronizarCanais();
        console.log('Sincronização de canais concluída!');

        console.log('Iniciando sincronização de condomínios...');
        await sincronizarCondominios();
        console.log('Sincronização de condomínios concluída!');

        console.log('Iniciando sincronização de hóspedes...');
        await sincronizarHospedes();
        console.log('Sincronização de hóspedes concluída!');

        console.log('Iniciando sincronização de imóveis...');
        await sincronizarImoveis();
        console.log('Sincronização de imóveis concluída!');

        console.log('Iniciando sincronização de proprietários...');
        await sincronizarProprietarios();
        console.log('Sincronização de proprietários concluída!');

        console.log('Iniciando sincronização de reservas...');
        await sincronizarReservas();
        console.log('Sincronização de reservas concluída!');

        console.log('Iniciando sincronização de taxas de reservas...');
        await sincronizarTaxasReservas();
        console.log('Sincronização de taxas de reservas concluída!');
        
    } catch (error: any) {
        console.error('Erro durante a sincronização geral:', error.message);
    }
}
