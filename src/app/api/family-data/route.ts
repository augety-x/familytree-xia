import { NextResponse, NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';

const SOURCE_FILE_MAP: Record<string, string> = {
  all: 'family-data.json',
  sanfang: 'family-data-sanfang.json',
};

export async function GET(request: NextRequest) {
  try {
    const source = request.nextUrl.searchParams.get('source') || 'all';
    const filename = SOURCE_FILE_MAP[source] || SOURCE_FILE_MAP.all;
    const configPath = path.join(process.cwd(), 'config', filename);

    if (!fs.existsSync(configPath)) {
      console.warn(`${filename} not found, returning empty data`);
      return NextResponse.json({ generations: [] });
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading family data:', error);
    return NextResponse.json(
      { error: 'Failed to load family data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, generation, person } = body as {
      source: string;
      generation: string; // generation title, e.g. "第1世"
      person: { name: string; info: string; fatherId?: string; birthYear?: number; deathYear?: number };
    };

    if (!person?.name || !generation) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const filename = SOURCE_FILE_MAP[source] || SOURCE_FILE_MAP.all;
    const configPath = path.join(process.cwd(), 'config', filename);

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: '数据文件不存在' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(fileContent);

    // Find or create the generation
    let gen = data.generations.find((g: { title: string }) => g.title === generation);
    if (!gen) {
      gen = { title: generation, people: [] };
      data.generations.push(gen);
      data.generations.sort((a: { title: string }, b: { title: string }) => {
        const numA = parseInt(a.title.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.title.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
    }

    // Generate ID: prefix-genXX-name-timestamp
    const genNum = generation.replace(/\D/g, '').padStart(2, '0');
    const prefix = source === 'sanfang' ? 'sf-' : '';
    const suffix = Date.now().toString(36).slice(-4);
    const id = `${prefix}gen${genNum}-${person.name}-${suffix}`;

    const newPerson = {
      id,
      name: person.name,
      info: person.info || '',
      fatherId: person.fatherId || null,
      birthYear: person.birthYear || null,
      deathYear: person.deathYear || null,
    };

    gen.people.push(newPerson);

    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json({ success: true, person: newPerson });
  } catch (error) {
    console.error('Error adding person:', error);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}

// PUT: update a person's info (only their own, verified by token)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, personId, token, updates } = body as {
      source: string;
      personId: string;
      token: string;
      updates: { info?: string; birthYear?: number | null; deathYear?: number | null };
    };

    if (!personId || !token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // Verify token matches the personId
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      if (tokenData.personId !== personId || Date.now() > tokenData.exp) {
        return NextResponse.json({ error: '无权编辑此人物' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'token 无效' }, { status: 401 });
    }

    const filename = SOURCE_FILE_MAP[source] || SOURCE_FILE_MAP.all;
    const configPath = path.join(process.cwd(), 'config', filename);

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: '数据文件不存在' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(fileContent);

    let found = false;
    for (const gen of data.generations) {
      for (const person of gen.people) {
        if (person.id === personId) {
          if (updates.info !== undefined) person.info = updates.info;
          if (updates.birthYear !== undefined) person.birthYear = updates.birthYear;
          if (updates.deathYear !== undefined) person.deathYear = updates.deathYear;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      return NextResponse.json({ error: '未找到该人物' }, { status: 404 });
    }

    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
} 