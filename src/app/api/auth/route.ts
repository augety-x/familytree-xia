import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const PASSWORDS_PATH = path.join(process.cwd(), 'config', 'passwords.json');

function loadPasswords(): Record<string, string> {
  try {
    if (fs.existsSync(PASSWORDS_PATH)) {
      return JSON.parse(fs.readFileSync(PASSWORDS_PATH, 'utf8'));
    }
  } catch { /* ignore */ }
  return {};
}

function savePasswords(data: Record<string, string>) {
  fs.writeFileSync(PASSWORDS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function makeToken(personId: string, name: string) {
  const tokenData = JSON.stringify({
    personId,
    name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return Buffer.from(tokenData).toString('base64');
}

// POST /api/auth — login or register
// body: { action: 'login' | 'register', personId, name, password }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, personId, name, password } = body as {
      action: 'login' | 'register' | 'check';
      personId?: string;
      name?: string;
      password?: string;
    };

    const passwords = loadPasswords();

    // check: return whether a personId has a password set
    if (action === 'check') {
      if (!personId) return NextResponse.json({ error: '缺少 personId' }, { status: 400 });
      return NextResponse.json({ hasPassword: !!passwords[personId] });
    }

    if (!personId || !name || !password) {
      return NextResponse.json({ success: false, message: '请填写所有字段' }, { status: 400 });
    }

    if (action === 'register') {
      if (passwords[personId]) {
        return NextResponse.json({ success: false, message: '该账号已设置密码，请直接登录' }, { status: 400 });
      }
      passwords[personId] = password;
      savePasswords(passwords);
      const token = makeToken(personId, name);
      return NextResponse.json({ success: true, token });
    }

    // login
    if (!passwords[personId]) {
      return NextResponse.json({ success: false, message: '该账号尚未设置密码，请先注册' }, { status: 401 });
    }
    if (passwords[personId] !== password) {
      return NextResponse.json({ success: false, message: '密码不正确' }, { status: 401 });
    }

    const token = makeToken(personId, name);
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('认证出错:', error);
    return NextResponse.json({ success: false, message: '验证失败，请重试' }, { status: 500 });
  }
} 