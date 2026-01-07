/**
 * Valid Soustack profile types
 */
export type SoustackProfile = 'lite' | 'base' | 'scalable' | 'timed' | 'equipped' | 'prepped' | 'illustrated';

/**
 * Valid Soustack profiles list
 */
export const VALID_SOUSTACK_PROFILES: SoustackProfile[] = [
  'lite',
  'base',
  'scalable',
  'timed',
  'equipped',
  'prepped',
  'illustrated',
];

/**
 * Soustack Recipe type
 * Always-valid recipe artifact with minimal structure
 */
export type SoustackLiteRecipe = {
  $schema: string;
  profile: SoustackProfile;
  stacks: Record<string, unknown>;
  name: string;
  description?: string;
  ingredients: unknown[];
  instructions: unknown[];
  'x-mise'?: {
    parse?: {
      confidence: number;
      mode: string;
    };
    prose?: {
      text: string;
      format: 'plain' | 'markdown';
      capturedAt: string;
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

