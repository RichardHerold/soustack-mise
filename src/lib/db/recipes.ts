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

export async function saveRecipe(params: {
  id?: string;
  doc: WorkbenchDoc;
}) {
  const supabase = supabaseBrowser();
  const userId = await requireUserId();

  const payload = {
    id: params.id,
    owner_id: userId,
    title: params.doc.recipe.name,
    doc: params.doc,
  };

  const { data, error } = await supabase
    .from('recipes')
    .upsert(payload)
    .select('id,updated_at,title')
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
    .select('id,title,updated_at,created_at')
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

