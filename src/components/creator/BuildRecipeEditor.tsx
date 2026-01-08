'use client';

import StructuredEditor from '@/components/StructuredEditor';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

type BuildRecipeEditorProps = {
  recipe: SoustackLiteRecipe;
  onChange: (recipe: SoustackLiteRecipe) => void;
};

/**
 * BuildRecipeEditor - Simplified editor for Creator flow
 * - Uses StructuredEditor in draft mode (no Mise mode toggle)
 * - No global warning/checklist panels (MiseCheckPanel, MiseGuidanceRail hidden)
 * - No CapabilitiesPanel (stacks are auto-detected from content)
 * - Inline guidance only (calm, contextual via InlineStackToggle in sections)
 * - Renders: Name, Ingredients, Instructions, After Cooking sections
 */
export default function BuildRecipeEditor({
  recipe,
  onChange,
}: BuildRecipeEditorProps) {
  return (
    <StructuredEditor
      recipe={recipe}
      onChange={onChange}
      miseMode="draft"
      hideHeader={true}
    />
  );
}
