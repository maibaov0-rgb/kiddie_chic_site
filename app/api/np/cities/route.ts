import { NextRequest, NextResponse } from 'next/server';
import { searchCities } from '@/lib/novaposhta';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ cities: [] });

  try {
    const cities = await searchCities(q);
    return NextResponse.json({
      cities: cities.map((c) => ({
        ref: c.Ref,
        name: c.Description,
        area: c.AreaDescription,
      })),
    });
  } catch (err) {
    console.error('NP cities error', err);
    return NextResponse.json({ cities: [], error: 'np_unavailable' }, { status: 502 });
  }
}
