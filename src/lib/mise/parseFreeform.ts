import type { ParseResult } from './types';

// Header patterns (case-insensitive, allow trailing colon)
const INGREDIENT_HEADERS = /^(ingredients?|ingredient\s+list)\s*:?\s*$/i;
const INSTRUCTION_HEADERS = /^(instructions?|directions?|method|steps?)\s*:?\s*$/i;

// List prefix patterns
const LIST_PREFIX = /^[\s]*[-*•]\s+|^[\s]*\d+[.)]\s+/;

// Common unit tokens for ingredient detection
const UNIT_TOKENS = /\b(cup|tbsp|tsp|oz|lb|g|kg|ml|l|clove|piece|pieces|slice|slices|can|cans|package|packages)\b/i;

// Fraction patterns (exclude numbered list markers like "1. " or "1) ")
const FRACTION_PATTERN = /^[\s]*(\d+\s*\/\s*\d+|\d+\s+\d+\/\d+|\d+\.\d+|\d+\s+)/;

/**
 * Checks if a line looks like an ingredient
 */
function isIngredientLike(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Strip list prefix and check content
  const stripped = stripListPrefix(line);
  if (!stripped) return false;

  // Check if it's a numbered list (like "1. " or "1) ") - these are usually instructions
  const isNumberedList = /^\d+[.)]\s+/.test(trimmed);
  
  // Starts with quantity/fraction (but not numbered list markers)
  // Check the stripped content for actual quantities
  if (!isNumberedList && (FRACTION_PATTERN.test(stripped) || FRACTION_PATTERN.test(trimmed))) {
    return true;
  }

  // Contains unit tokens (check both original and stripped)
  if (UNIT_TOKENS.test(trimmed) || UNIT_TOKENS.test(stripped)) return true;

  // Bullet points (not numbered) are often ingredients
  if (/^[\s]*[-*•]\s+/.test(line)) return true;

  return false;
}

/**
 * Strips list prefixes from a line
 */
function stripListPrefix(line: string): string {
  return line.replace(LIST_PREFIX, '').trim();
}

/**
 * Normalizes newlines and splits into lines
 */
function normalizeLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Parses freeform recipe text into structured components.
 * Conservative, explainable rules. Never throws.
 */
export function parseFreeform(text: string): ParseResult {
  if (!text || typeof text !== 'string') {
    return {
      title: null,
      ingredients: [],
      instructions: [],
      confidence: 0.1,
      mode: 'fallback',
    };
  }

  const lines = normalizeLines(text);

  if (lines.length === 0) {
    return {
      title: null,
      ingredients: [],
      instructions: [],
      confidence: 0.1,
      mode: 'fallback',
    };
  }

  // Find explicit headers
  let ingredientsHeaderIndex = -1;
  let instructionsHeaderIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (INGREDIENT_HEADERS.test(lines[i])) {
      ingredientsHeaderIndex = i;
    }
    if (INSTRUCTION_HEADERS.test(lines[i])) {
      instructionsHeaderIndex = i;
    }
  }

  const hasExplicitHeaders = ingredientsHeaderIndex >= 0 || instructionsHeaderIndex >= 0;

  if (hasExplicitHeaders) {
    // Parse with explicit sections
    const titleLines: string[] = [];
    const ingredientLines: string[] = [];
    const instructionLines: string[] = [];

    let currentSection: 'title' | 'ingredients' | 'instructions' = 'title';
    const hasIngredientsHeader = ingredientsHeaderIndex >= 0;
    const hasInstructionsHeader = instructionsHeaderIndex >= 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip header lines
      if (INGREDIENT_HEADERS.test(line) || INSTRUCTION_HEADERS.test(line)) {
        if (INGREDIENT_HEADERS.test(line)) {
          currentSection = 'ingredients';
        } else if (INSTRUCTION_HEADERS.test(line)) {
          currentSection = 'instructions';
        }
        continue;
      }

      // If we have Ingredients header but no Instructions header,
      // switch to instructions when we encounter non-ingredient-like lines
      if (
        currentSection === 'ingredients' &&
        hasIngredientsHeader &&
        !hasInstructionsHeader &&
        ingredientLines.length > 0 &&
        !isIngredientLike(line)
      ) {
        currentSection = 'instructions';
      }

      // Route to appropriate section
      if (currentSection === 'title') {
        titleLines.push(line);
      } else if (currentSection === 'ingredients') {
        ingredientLines.push(stripListPrefix(line));
      } else if (currentSection === 'instructions') {
        instructionLines.push(stripListPrefix(line));
      }
    }

    const title = titleLines.length > 0 ? titleLines[0] : null;

    return {
      title,
      ingredients: ingredientLines,
      instructions: instructionLines,
      confidence: 0.85,
      mode: 'explicit-sections',
    };
  }

  // No explicit headers - use heuristics
  const ingredientLines: string[] = [];
  const instructionLines: string[] = [];

  // Check if early lines are ingredient-heavy
  const earlyLines = lines.slice(0, Math.min(5, lines.length));
  const ingredientCount = earlyLines.filter(isIngredientLike).length;
  const isIngredientHeavy = ingredientCount >= 2;

  if (isIngredientHeavy) {
    // Collect ingredients until a clear instruction-like line appears
    let foundInstructions = false;

    for (const line of lines) {
      const stripped = stripListPrefix(line);

      if (!foundInstructions && isIngredientLike(line)) {
        ingredientLines.push(stripped);
      } else {
        foundInstructions = true;
        instructionLines.push(stripped);
      }
    }
  } else {
    // Treat all as instructions
    for (const line of lines) {
      instructionLines.push(stripListPrefix(line));
    }
  }

  // Title is first non-empty line
  const title = lines.length > 0 ? lines[0] : null;

  return {
    title,
    ingredients: ingredientLines,
    instructions: instructionLines,
    confidence: 0.55,
    mode: 'heuristic',
  };
}

