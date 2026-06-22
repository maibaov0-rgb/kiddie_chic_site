import { NextRequest, NextResponse } from 'next/server';
import { getBranches } from '@/lib/novaposhta';

export async function GET(req: NextRequest) {
  const cityRef = req.nextUrl.searchParams.get('cityRef')?.trim() ?? '';
  if (!cityRef) return NextResponse.json({ branches: [] });

  try {
    const branches = await getBranches(cityRef);
    return NextResponse.json({
      branches: branches.map((b) => ({
        ref: b.Ref,
        number: b.Number,
        description: b.Description,
      })),
    });
  } catch (err) {
    console.error('NP branches error', err);
    return NextResponse.json({ branches: [], error: 'np_unavailable' }, { status: 502 });
  }
}
