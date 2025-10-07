
import { NextResponse } from 'next/server';
import { usersService } from '@/lib/users-service';
import { cryptoService } from '@/lib/crypto-service';
import { SUPER_ADMIN } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se é o super admin padrão do sistema
    if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
      const { password: _, ...userWithoutPassword } = SUPER_ADMIN;
      return NextResponse.json({ user: userWithoutPassword });
    }

    // Tentar buscar usuários da API (pode falhar se a API estiver indisponível)
    try {
      const users = await usersService.getAll();
      const user = users.find((u) => u.email === email && u.status === 'ativo');

      if (user && user.password) {
        const isPasswordValid = await cryptoService.comparePassword(password, user.password);

        if (isPasswordValid) {
          // Remove password from response
          const { password: _, ...userWithoutPassword } = user;
          return NextResponse.json({ user: userWithoutPassword });
        }
      }
    } catch (apiError) {
      console.error('Erro ao buscar usuários da API:', apiError);
      // Continua para retornar erro de credenciais inválidas
    }

    return NextResponse.json(
      { error: 'Email ou senha inválidos, ou usuário não aprovado' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login. Tente novamente.' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
