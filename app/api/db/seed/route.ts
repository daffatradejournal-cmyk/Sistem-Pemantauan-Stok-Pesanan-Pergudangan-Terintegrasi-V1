import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Gagal melakukan seed data ke PostgreSQL',
    }, { status: 500 });
  }
}
