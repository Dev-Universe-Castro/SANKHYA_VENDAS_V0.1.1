
import { NextResponse } from 'next/server';
import { usersService } from '@/lib/users-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let resultado;

    if (body.id) {
      resultado = await usersService.update(body.id, body);
    } else {
      resultado = await usersService.create(body);
    }

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao salvar usuário:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar usuário' },
      { status: 500 }
    );
  }
}
