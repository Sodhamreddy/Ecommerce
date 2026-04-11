import { NextResponse } from 'next/server';
import { fetchSmartSliderSlides } from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';

export async function GET() {
    const slides = await fetchSmartSliderSlides(2);
    return NextResponse.json({ count: slides.length, slides });
}
