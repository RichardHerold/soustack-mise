import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import type { WorkbenchDoc } from '@/lib/mise/workbenchDoc';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('doc')
    .eq('id', params.id)
    .single();

  if (error || !data?.doc) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  // Extract recipe from WorkbenchDoc
  const workbenchDoc = data.doc as WorkbenchDoc;
  let recipe = workbenchDoc?.recipe;

  // Safety: if recipe is missing or invalid, fall back to minimal always-valid recipe
  if (!recipe || typeof recipe !== 'object' || !recipe.name) {
    recipe = compileLiteRecipe({});
  }

  return new NextResponse(JSON.stringify(recipe), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.soustack+json; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}

