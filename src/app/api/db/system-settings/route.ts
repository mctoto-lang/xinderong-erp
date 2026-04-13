import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/sqlite';
import { generateId } from '@/lib/format';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM system_settings WHERE key = ?').get(key);

    if (existing) {
      db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(value, key);
    } else {
      const id = generateId();
      db.prepare('INSERT INTO system_settings (id, key, value) VALUES (?, ?, ?)').run(id, key, value);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST system-settings error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
