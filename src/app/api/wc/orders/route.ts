export const dynamic = 'force-static';
import { NextResponse } from 'next/server';

// In production this route is handled by public/api/wc/orders.php via .htaccess
// This static export exists only to satisfy output: 'export' build requirements
export async function GET() {
    return NextResponse.json([]);
}
