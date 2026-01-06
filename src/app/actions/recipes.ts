'use server';

import { supabaseServer } from '@/lib/supabase/server';
import type { WorkbenchDoc } from '@/lib/mise/workbenchDoc';

/**
 * Computes the next revision number for a recipe.
 * Returns max(revision) + 1, or 1 if no revisions exist.
 */
async function getNextRevision(
  supabase: ReturnType<typeof supabaseServer>,
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

export async function saveRecipeAction(args: {
  id?: string;
  doc: WorkbenchDoc;
}): Promise<{
  id: string;
  title: string;
  updated_at: string;
  is_public: boolean;
  public_id: string | null;
}> {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    throw new Error('AUTH_REQUIRED');
  }

  const userId = auth.user.id;

  // Build payload - only include id if provided (for updates)
  const payload: {
    id?: string;
    owner_id: string;
    title: string;
    doc: WorkbenchDoc;
  } = {
    owner_id: userId,
    title: args.doc.recipe.name,
    doc: args.doc,
  };

  // Only include id if provided (for updates)
  if (args.id) {
    payload.id = args.id;
  }

  // Use upsert with onConflict to ensure updates work correctly
  const { data, error } = await supabase
    .from('recipes')
    .upsert(payload, {
      onConflict: 'id',
    })
    .select('id,updated_at,title,is_public,public_id')
    .single();

  if (error || !data) {
    throw new Error('NOT_FOUND');
  }

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
        doc: args.doc,
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

  return {
    id: data.id,
    title: data.title,
    updated_at: data.updated_at,
    is_public: data.is_public ?? false,
    public_id: data.public_id ?? null,
  };
}

export async function setRecipePublicAction(args: {
  recipeId: string;
  makePublic: boolean;
}): Promise<{
  id: string;
  title: string;
  updated_at: string;
  is_public: boolean;
  public_id: string | null;
}> {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    throw new Error('AUTH_REQUIRED');
  }

  const { data, error } = await supabase
    .from('recipes')
    .update({ is_public: args.makePublic })
    .eq('id', args.recipeId)
    .select('id,title,updated_at,is_public,public_id')
    .single();

  if (error || !data) {
    throw new Error('NOT_FOUND');
  }

  return {
    id: data.id,
    title: data.title,
    updated_at: data.updated_at,
    is_public: data.is_public ?? false,
    public_id: data.public_id ?? null,
  };
}

