import { NextResponse } from 'next/server';
import { testConnection, getDatabaseUrl } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await testConnection();
  const rawUrl = getDatabaseUrl();
  
  // Mask password for security
  let maskedUrl = rawUrl;
  try {
    const urlObj = new URL(rawUrl);
    if (urlObj.password) {
      urlObj.password = '••••••••';
      maskedUrl = urlObj.toString();
    }
  } catch {}

  return NextResponse.json({
    success: status.connected,
    status,
    databaseUrl: maskedUrl,
  });
}
