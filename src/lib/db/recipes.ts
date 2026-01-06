import type { WorkbenchDoc } from '@/lib/mise/workbenchDoc';
import { supabaseBrowser } from '@/lib/supabase/client';

export async function requireUserId(): Promise<string> {
  const supabase = supabaseBrowser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('AUTH_REQUIRED');
  return data.user.id;
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

