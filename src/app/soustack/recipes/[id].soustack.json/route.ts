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

  // A1) Auth handling: return 401 if not signed in
  if (!auth.user) {
    return NextResponse.json(
      { error: 'AUTH_REQUIRED' },
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'private, no-store',
        },
      }
    );
  }

  // A2) Owner-only access: RLS enforces that only owner can see the row
  const { data, error } = await supabase
    .from('recipes')
    .select('doc')
    .eq('id', params.id)
    .single();

  // A2) If no row is visible (not found OR not owned), return 404
  // Prefer 404 for signed-in non-owner to avoid leaking existence
  if (error || !data?.doc) {
    return NextResponse.json(
      { error: 'NOT_FOUND' },
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'private, no-store',
        },
      }
    );
  }

  // A3) Extract recipe from WorkbenchDoc - return ONLY doc.recipe
  const workbenchDoc = data.doc as WorkbenchDoc;
  let recipe = workbenchDoc?.recipe;

  // A3) Safety: if recipe is missing/malformed, fall back to compileLiteRecipe({})
  // Never throw; always return valid recipe
  if (!recipe || typeof recipe !== 'object' || !recipe.name) {
    recipe = compileLiteRecipe({});
  }

  // A3) Return compact JSON with correct headers
  return new NextResponse(JSON.stringify(recipe), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.soustack+json; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}

/*
 * Manual verification checklist:
 *
 * 1. Signed out → 401
 *    - GET /soustack/recipes/[id].soustack.json without auth
 *    - Expected: 401, { error: "AUTH_REQUIRED" }, Content-Type: application/json
 *
 * 2. Signed in + owner → 200, correct content-type, recipe JSON only
 *    - GET /soustack/recipes/[id].soustack.json with valid auth for recipe owner
 *    - Expected: 200, recipe JSON, Content-Type: application/vnd.soustack+json
 *
 * 3. Signed in + different user → 404
 *    - GET /soustack/recipes/[id].soustack.json with valid auth for different user
 *    - Expected: 404, { error: "NOT_FOUND" } (RLS blocks access)
 *
 * 4. Response has Cache-Control: private, no-store
 *    - Check all responses (401, 404, 200) include Cache-Control header
 */

