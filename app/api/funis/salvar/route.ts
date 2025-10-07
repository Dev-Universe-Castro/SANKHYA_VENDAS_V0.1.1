
import { NextResponse } from 'next/server';
import { salvarFunil } from '@/lib/funis-service';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const funil = await salvarFunil(data);
    return NextResponse.json(funil);
  } catch (error: any) {
    console.error('❌ API - Erro ao salvar funil:', error.message);
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar funil' },
      { status: 500 }
    );
  }
}
