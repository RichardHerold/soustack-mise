import type { WorkbenchDoc } from '@/lib/mise/workbenchDoc';
import { supabaseBrowser } from '@/lib/supabase/client';

export async function requireUserId(): Promise<string> {
  const supabase = supabaseBrowser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('AUTH_REQUIRED');
  return data.user.id;
}

/**
 * Computes the next revision number for a recipe.
 * Returns max(revision) + 1, or 1 if no revisions exist.
 */
async function getNextRevision(
  supabase: ReturnType<typeof supabaseBrowser>,
  recipeId: string,
  ownerId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('recipe_revisions')
    .select('revision')
    .eq('recipe_id', recipeId)
    .eq('owner_id', ownerId)
    .order('revision', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // For any error, log and default to 1
    console.warn('Error fetching max revision, defaulting to 1:', error);
    return 1;
  }

  // If no rows found (data is null), start at revision 1
  // Otherwise, use max revision + 1
  return (data?.revision ?? 0) + 1;
}

/**
 * @deprecated Use saveRecipeAction from @/app/actions/recipes instead.
 * This client-side write function is kept for backward compatibility but should not be used.
 * Server actions provide better security and are the preferred approach.
 */
export async function saveRecipe(params: {
  id?: string;
  doc: WorkbenchDoc;
}) {
  const supabase = supabaseBrowser();
  const userId = await requireUserId();

  // Build payload - only include id if provided (for updates)
  const payload: {
    id?: string;
    owner_id: string;
    title: string;
    doc: WorkbenchDoc;
  } = {
    owner_id: userId,
    title: params.doc.recipe.name,
    doc: params.doc,
  };

  // Only include id if provided (for updates)
  if (params.id) {
    payload.id = params.id;
  }

  // Use upsert with onConflict to ensure updates work correctly
  const { data, error } = await supabase
    .from('recipes')
    .upsert(payload, {
      onConflict: 'id',
    })
    .select('id,updated_at,title,is_public,public_id')
    .single();

  if (error) throw error;

  // Append-only revision: insert snapshot into recipe_revisions
  // Best-effort: if this fails, log but don't fail the save
  const recipeId = data.id;
  try {
    const nextRevision = await getNextRevision(supabase, recipeId, userId);

    const { error: revisionError } = await supabase
      .from('recipe_revisions')
      .insert({
        recipe_id: recipeId,
        owner_id: userId,
        revision: nextRevision,
        doc: params.doc,
      });

    if (revisionError) {
      console.error(
        'Failed to insert recipe revision (non-fatal):',
        revisionError
      );
    }
  } catch (revisionErr) {
    console.error(
      'Error creating recipe revision (non-fatal):',
      revisionErr
    );
  }

  return data;
}

export async function listMyRecipes() {
  const supabase = supabaseBrowser();
  await requireUserId();

  const { data, error } = await supabase
    .from('recipes')
    .select('id,title,updated_at,created_at,is_public,public_id')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function loadRecipe(id: string): Promise<WorkbenchDoc> {
  const supabase = supabaseBrowser();
  await requireUserId();

  const { data, error } = await supabase
    .from('recipes')
    .select('doc')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data.doc as WorkbenchDoc;
}

/**
 * Loads recipe with metadata (including public status).
 * Returns both the doc and metadata.
 * Requires auth (owner-only via RLS).
 */
export async function loadRecipeWithMeta(id: string) {
  const supabase = supabaseBrowser();
  await requireUserId();

  const { data, error } = await supabase
    .from('recipes')
    .select('doc,is_public,public_id')
    .eq('id', id)
    .single();

  if (error) throw error;
  return {
    doc: data.doc as WorkbenchDoc,
    is_public: data.is_public ?? false,
    public_id: data.public_id ?? null,
  };
}

/**
 * Loads a recipe by ID for read-only viewing.
 * Works for public recipes (no auth) or private recipes (auth required, owner-only).
 * Returns null if not found or not accessible.
 */
export async function loadRecipeForView(id: string): Promise<{
  doc: WorkbenchDoc;
  is_public: boolean;
  public_id: string | null;
  is_owner: boolean;
} | null> {
  const supabase = supabaseBrowser();
  const { data: auth } = await supabase.auth.getUser();

  // Try to load recipe (RLS will enforce access)
  const { data, error } = await supabase
    .from('recipes')
    .select('doc,is_public,public_id,owner_id')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if user is owner
  const is_owner = auth.user?.id === data.owner_id;

  // If not public and not owner, return null
  if (!data.is_public && !is_owner) {
    return null;
  }

  return {
    doc: data.doc as WorkbenchDoc,
    is_public: data.is_public ?? false,
    public_id: data.public_id ?? null,
    is_owner,
  };
}

/**
 * @deprecated Use setRecipePublicAction from @/app/actions/recipes instead.
 * This client-side write function is kept for backward compatibility but should not be used.
 * Server actions provide better security and are the preferred approach.
 */
export async function setRecipePublic(
  recipeId: string,
  makePublic: boolean
) {
  const supabase = supabaseBrowser();
  await requireUserId();

  const { data, error } = await supabase
    .from('recipes')
    .update({ is_public: makePublic })
    .eq('id', recipeId)
    .select('id,is_public,public_id,updated_at,title')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Gets recipe metadata (owner-only via RLS).
 */
export async function getRecipeMeta(recipeId: string) {
  const supabase = supabaseBrowser();
  await requireUserId();

  const { data, error } = await supabase
    .from('recipes')
    .select('id,is_public,public_id,title,updated_at')
    .eq('id', recipeId)
    .single();

  if (error) throw error;
  return data;
}

