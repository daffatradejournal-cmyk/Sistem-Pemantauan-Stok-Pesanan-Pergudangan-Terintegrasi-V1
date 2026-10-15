import { NextResponse } from 'next/server';
import { setDatabaseUrlOverride, testConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { databaseUrl } = body;

    if (!databaseUrl || typeof databaseUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'Database URL tidak boleh kosong' }, { status: 400 });
    }

    // Set temporary override in memory
    setDatabaseUrlOverride(databaseUrl.trim());

    // Test new connection
    const test = await testConnection();

    if (!test.connected) {
      return NextResponse.json({
        success: false,
        error: `Gagal terkoneksi dengan database baru: ${test.error}`,
        test,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil terhubung ke database (${test.database}) dengan latensi ${test.latencyMs}ms!`,
      test,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
