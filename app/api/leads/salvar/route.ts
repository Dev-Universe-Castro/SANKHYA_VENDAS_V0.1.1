import { NextResponse } from 'next/server';
import { salvarLead } from '@/lib/leads-service';

export async function POST(request: Request) {
  try {
    const leadData = await request.json();
    
    console.log('📥 Dados recebidos para salvar lead:', JSON.stringify(leadData, null, 2));
    
    // Validar e sanitizar os dados
    const sanitizedData = {
      ...(leadData.CODLEAD && { CODLEAD: String(leadData.CODLEAD) }),
      NOME: String(leadData.NOME || ""),
      DESCRICAO: String(leadData.DESCRICAO || ""),
      VALOR: Number(leadData.VALOR || 0),
      CODESTAGIO: String(leadData.CODESTAGIO || ""),
      CODFUNIL: String(leadData.CODFUNIL || ""),
      DATA_VENCIMENTO: String(leadData.DATA_VENCIMENTO || ""),
      TIPO_TAG: String(leadData.TIPO_TAG || ""),
      COR_TAG: String(leadData.COR_TAG || "#3b82f6"),
      CODPARC: String(leadData.CODPARC || "")
    };
    
    console.log('✅ Dados sanitizados:', JSON.stringify(sanitizedData, null, 2));
    
    const leadSalvo = await salvarLead(sanitizedData);
    
    console.log('✅ Lead salvo com sucesso');
    
    return NextResponse.json(leadSalvo);
  } catch (error: any) {
    console.error('❌ API Route - Erro ao salvar lead:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar lead' },
      { status: 500 }
    );
  }
}