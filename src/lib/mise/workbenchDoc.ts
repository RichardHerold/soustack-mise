import type { SoustackLiteRecipe } from './types';
import { compileLiteRecipe } from './liteCompiler';

/**
 * WorkbenchDoc - canonical application state
 * Matches the model defined in AGENTS.MD
 */
export type WorkbenchDoc = {
  recipe: SoustackLiteRecipe; // canonical, always valid
  draft: {
    mode: 'raw' | 'structured';
    rawText: string; // editable in raw mode; snapshot after conversion
    lastImport?: {
      source: 'paste' | 'upload' | 'manual';
      confidence: number;
      mode: string;
      at: string;
    };
  };
  extensions?: {
    prose?: {
      text: string;
      format: 'plain' | 'markdown';
      capturedAt: string;
    };
  };
  meta: {
    revision: number;
    updatedAt: string;
  };
};

/**
 * Creates a new empty WorkbenchDoc
 */
export function createEmptyWorkbenchDoc(): WorkbenchDoc {
  const now = new Date().toISOString();
  return {
    recipe: compileLiteRecipe({}),
    draft: {
      mode: 'raw',
      rawText: '',
    },
    meta: {
      revision: 0,
      updatedAt: now,
    },
  };
}

/**
 * Helper to get current ISO timestamp
 */
export function nowIso(): string {
  return new Date().toISOString();
}

