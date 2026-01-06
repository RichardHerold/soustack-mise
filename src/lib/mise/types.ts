/**
 * Soustack Lite Recipe type
 * Always-valid recipe artifact with minimal structure
 */
export type SoustackLiteRecipe = {
  $schema: string;
  profile: 'lite';
  stacks: Record<string, never>;
  name: string;
  ingredients: unknown[];
  instructions: unknown[];
  'x-mise'?: {
    parse: {
      confidence: number;
      mode: string;
    };
  };
};

/**
 * Parse result from freeform text
 */
export type ParseResult = {
  title: string | null;
  ingredients: string[];
  instructions: string[];
  confidence: number; // 0..1
  mode: 'explicit-sections' | 'heuristic' | 'fallback';
};

