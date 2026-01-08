import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

const CANONICAL_SCHEMA_URL = 'https://soustack.org/lite.schema.json';

// Initialize Gemini
function getGeminiModel() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  });
}

// Prompt for Gemini
function createConversionPrompt(text: string): string {
  return `You are a recipe parser that converts freeform recipe text into structured JSON format.

Parse the following recipe text and output ONLY valid JSON (no markdown code fences, no explanations):

${text}

Output a JSON object with this exact structure:
{
  "name": "Recipe Name",
  "description": "Optional description",
  "servings": "4 servings" or null,
  "ingredients": [
    { "quantity": 2, "unit": "cups", "name": "flour", "prep": "sifted" },
    { "quantity": { "min": 2, "max": 3 }, "unit": "cloves", "name": "garlic", "prep": "minced" },
    { "name": "salt", "toTaste": true }
  ],
  "instructions": [
    { "text": "Preheat oven to 375°F" },
    { 
      "text": "Bake until golden",
      "timing": {
        "minutes": 10,
        "activity": "passive",
        "completionCue": "golden brown"
      }
    }
  ]
}

Rules:
- quantity can be a number, decimal, or range object { "min": X, "max": Y }
- unit should be standardized: cups, tbsp, tsp, g, oz, lb, ml, l, etc.
- prep is optional (diced, minced, softened, etc.)
- For "to taste" ingredients: use { "name": "ingredient", "toTaste": true } (omit quantity/unit)
- timing.minutes for exact duration (number), or timing.minMinutes and timing.maxMinutes for ranges
- timing.activity must be "active" or "passive"
- timing.completionCue is optional (e.g., "golden brown", "tender")
- Output ONLY valid JSON, no markdown fences, no code blocks, no explanations`;
}

// Strip markdown code fences if present
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// Infer stacks from recipe content
function inferStacks(recipe: {
  ingredients?: unknown[];
  instructions?: unknown[];
}): Record<string, number> {
  const stacks: Record<string, number> = {};

  // Check for timing in instructions
  if (Array.isArray(recipe.instructions)) {
    const hasTiming = recipe.instructions.some(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'timing' in item &&
        item.timing !== undefined
    );
    if (hasTiming) {
      stacks.timed = 1;
    }
  }

  // Check for toTaste in ingredients
  if (Array.isArray(recipe.ingredients)) {
    const hasToTaste = recipe.ingredients.some(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'toTaste' in item &&
        item.toTaste === true
    );
    if (hasToTaste) {
      stacks.scaling = 1;
    }
  }

  return stacks;
}

// Transform Gemini output to SoustackLiteRecipe
function transformToSoustackRecipe(
  geminiOutput: {
    name?: string;
    description?: string;
    servings?: string | null;
    ingredients?: unknown[];
    instructions?: unknown[];
  },
  originalText: string
): SoustackLiteRecipe {
  const stacks = inferStacks(geminiOutput);

  const recipe: SoustackLiteRecipe = {
    $schema: CANONICAL_SCHEMA_URL,
    profile: 'lite',
    stacks,
    name: geminiOutput.name?.trim() || 'Untitled Recipe',
    ...(geminiOutput.description?.trim() && {
      description: geminiOutput.description.trim(),
    }),
    ingredients: geminiOutput.ingredients || [],
    instructions: geminiOutput.instructions || [],
    'x-mise': {
      source: {
        text: originalText,
        convertedAt: new Date().toISOString(),
        converter: 'gemini-2.0-flash',
      },
    },
  };

  return recipe;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Get Gemini model
    const model = getGeminiModel();

    // Create prompt
    const prompt = createConversionPrompt(text.trim());

    // Call Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const geminiText = response.text();

    // Strip markdown fences and parse JSON
    const cleanedText = stripMarkdownFences(geminiText);
    let parsed: {
      name?: string;
      description?: string;
      servings?: string | null;
      ingredients?: unknown[];
      instructions?: unknown[];
    };

    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', parseError);
      console.error('Raw output:', geminiText);
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      );
    }

    // Transform to Soustack format
    const recipe = transformToSoustackRecipe(parsed, text.trim());

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Recipe conversion error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('GOOGLE_AI_API_KEY')) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Failed to convert recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
