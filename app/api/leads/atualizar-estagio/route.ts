
import { NextResponse } from 'next/server';
import { atualizarEstagioLead } from '@/lib/leads-service';

export async function POST(request: Request) {
  try {
    const { codLeed, novoEstagio } = await request.json();
    
    const resultado = await atualizarEstagioLead(codLeed, novoEstagio);
    
    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('❌ API Route - Erro ao atualizar estágio:', error.message);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar estágio' },
      { status: 500 }
    );
  }
}
