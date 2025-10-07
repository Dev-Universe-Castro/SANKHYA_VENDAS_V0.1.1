
import { NextResponse } from 'next/server';
import { consultarParceiros } from '@/lib/sankhya-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const searchName = searchParams.get('searchName') || '';
    const searchCode = searchParams.get('searchCode') || '';

    const resultado = await consultarParceiros(page, pageSize, searchName, searchCode);
    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao consultar parceiros:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao consultar parceiros' },
      { status: 500 }
    );
  }
}
