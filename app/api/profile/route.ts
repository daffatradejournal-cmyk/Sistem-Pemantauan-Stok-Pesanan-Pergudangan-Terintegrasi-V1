import { NextResponse } from 'next/server';
import { getStoreProfile, updateStoreProfile } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profile = await getStoreProfile();
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      profile: {
        ownerName: 'Muhammad',
        storeName: 'StokPintar UMKM',
        roleTitle: 'Pemilik Usaha (UMKM)',
        avatarUrl: '',
      },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateStoreProfile(body);
    return NextResponse.json({
      success: true,
      profile: updated,
      message: 'Profil pemilik toko berhasil diperbarui di database PostgreSQL!',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Gagal menyimpan profil ke database PostgreSQL',
      },
      { status: 500 }
    );
  }
}
