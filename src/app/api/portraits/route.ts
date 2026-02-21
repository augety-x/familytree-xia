import { NextResponse, NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';

const PORTRAITS_DIR = path.join(process.cwd(), 'public', 'portraits');

function ensureDir() {
  if (!fs.existsSync(PORTRAITS_DIR)) {
    fs.mkdirSync(PORTRAITS_DIR, { recursive: true });
  }
}

// GET: return list of person IDs that have portraits
export async function GET() {
  try {
    ensureDir();
    const files = fs.readdirSync(PORTRAITS_DIR);
    const portraitMap: Record<string, string> = {};
    for (const file of files) {
      const ext = path.extname(file);
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase())) {
        const personId = path.basename(file, ext);
        portraitMap[personId] = `/portraits/${file}`;
      }
    }
    return NextResponse.json(portraitMap);
  } catch (error) {
    console.error('Error reading portraits:', error);
    return NextResponse.json({});
  }
}

// POST: upload a portrait image for a person
export async function POST(request: NextRequest) {
  try {
    ensureDir();
    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    const file = formData.get('file') as File;

    if (!personId || !file) {
      return NextResponse.json({ error: 'Missing personId or file' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase() || '.jpg';
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Remove old portraits for this person
    const existing = fs.readdirSync(PORTRAITS_DIR);
    for (const f of existing) {
      if (f.startsWith(personId + '.')) {
        fs.unlinkSync(path.join(PORTRAITS_DIR, f));
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${personId}${ext}`;
    fs.writeFileSync(path.join(PORTRAITS_DIR, filename), buffer);

    return NextResponse.json({ url: `/portraits/${filename}` });
  } catch (error) {
    console.error('Error uploading portrait:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
