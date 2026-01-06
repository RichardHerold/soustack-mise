import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';

export async function GET(
  _req: Request,
  { params }: { params: { public_id: string } }
) {
  const supabase = supabaseServer();

  // Call the SECURITY DEFINER function to get public recipe
  // No auth required - uses anon key
  const { data, error } = await supabase.rpc('get_public_recipe', {
    p_public_id: params.public_id,
  });

  // If RPC returns null/empty => 404
  // RPC returns jsonb, which may be null if not found
  if (error || !data || data === null) {
    return NextResponse.json(
      { error: 'NOT_FOUND' },
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=60, s-maxage=600',
        },
      }
    );
  }

  // Safety: if recipe is missing/malformed, fall back to minimal always-valid recipe
  // data is jsonb from the function, which should be the recipe object
  let recipe = data;
  if (!recipe || typeof recipe !== 'object' || !recipe.name) {
    recipe = compileLiteRecipe({});
  }

  // Return only the recipe JSON with public caching headers
  return new NextResponse(JSON.stringify(recipe), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.soustack+json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=600',
    },
  });
}

