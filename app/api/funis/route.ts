
import { NextResponse } from 'next/server';
import { consultarFunis } from '@/lib/funis-service';

export async function GET() {
  try {
    console.log('📡 API - Iniciando consulta de funis...');
    const funis = await consultarFunis();
    console.log(`✅ API - ${funis.length} funis retornados`);
    return NextResponse.json(funis);
  } catch (error: any) {
    console.error('❌ API - Erro ao consultar funis:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao consultar funis',
        details: 'Verifique a conexão com a API Sankhya'
      },
      { status: 500 }
    );
  }
}

// Desabilitar cache para esta rota
export const dynamic = 'force-dynamic';
export const revalidate = 0;
