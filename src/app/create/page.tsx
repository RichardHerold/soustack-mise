'use client';

import { useState, useEffect } from 'react';
import { compileLiteRecipe } from '@/lib/mise/liteCompiler';
import { parseFreeform } from '@/lib/mise/parseFreeform';
import type { SoustackLiteRecipe } from '@/lib/mise/types';
import RecipeCreator from '@/components/RecipeCreator/RecipeCreator';

export default function CreatePage() {
  const [recipe, setRecipe] = useState<SoustackLiteRecipe>(() => compileLiteRecipe({}));

  return <RecipeCreator initialRecipe={recipe} onRecipeChange={setRecipe} />;
}
