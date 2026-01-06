import { parseFreeform } from '../parseFreeform';
import type { ParseResult } from '../types';

describe('parseFreeform', () => {
  it('parses explicit sections correctly', () => {
    const text = `Chocolate Cake

Ingredients:
- 2 cups flour
- 1 cup sugar
- 3 eggs

Instructions:
1. Mix dry ingredients
2. Add eggs
3. Bake at 350F`;

    const result = parseFreeform(text);

    expect(result.mode).toBe('explicit-sections');
    expect(result.confidence).toBe(0.85);
    expect(result.title).toBe('Chocolate Cake');
    expect(result.ingredients).toEqual(['2 cups flour', '1 cup sugar', '3 eggs']);
    expect(result.instructions).toEqual(['Mix dry ingredients', 'Add eggs', 'Bake at 350F']);
  });

  it('handles case-insensitive headers', () => {
    const text = `INGREDIENTS:
- Flour
- Sugar

DIRECTIONS:
- Mix
- Bake`;

    const result = parseFreeform(text);

    expect(result.mode).toBe('explicit-sections');
    expect(result.ingredients).toEqual(['Flour', 'Sugar']);
    expect(result.instructions).toEqual(['Mix', 'Bake']);
  });

  it('handles headers with trailing colons', () => {
    const text = `Ingredients:
- Flour

Instructions:
- Mix`;

    const result = parseFreeform(text);

    expect(result.mode).toBe('explicit-sections');
    expect(result.ingredients).toEqual(['Flour']);
    expect(result.instructions).toEqual(['Mix']);
  });

  it('parses with no headers using heuristics', () => {
    const text = `2 cups flour
1 cup sugar
3 eggs

Mix all ingredients together
Bake at 350F for 30 minutes`;

    const result = parseFreeform(text);

    expect(result.mode).toBe('heuristic');
    expect(result.confidence).toBe(0.55);
    expect(result.ingredients.length).toBeGreaterThan(0);
    expect(result.instructions.length).toBeGreaterThan(0);
  });

  it('treats all as instructions when not ingredient-heavy', () => {
    const text = `Mix the flour and sugar
Add the eggs
Bake at 350F`;

    const result = parseFreeform(text);

    expect(result.mode).toBe('heuristic');
    expect(result.ingredients).toEqual([]);
    expect(result.instructions.length).toBeGreaterThan(0);
  });

  it('extracts title from first line before headers', () => {
    const text = `My Favorite Recipe

Ingredients:
- Flour`;

    const result = parseFreeform(text);

    expect(result.title).toBe('My Favorite Recipe');
  });

  it('extracts title from first line when no headers', () => {
    const text = `Chocolate Cake
2 cups flour
Mix and bake`;

    const result = parseFreeform(text);

    expect(result.title).toBe('Chocolate Cake');
  });

  it('strips list prefixes', () => {
    const text = `Ingredients:
- 2 cups flour
* 1 cup sugar
• 3 eggs
1. Mix
2. Bake`;

    const result = parseFreeform(text);

    expect(result.ingredients[0]).toBe('2 cups flour');
    expect(result.ingredients[1]).toBe('1 cup sugar');
    expect(result.ingredients[2]).toBe('3 eggs');
    expect(result.instructions[0]).toBe('Mix');
    expect(result.instructions[1]).toBe('Bake');
  });

  it('normalizes different newline formats', () => {
    const text = 'Line 1\r\nLine 2\rLine 3\nLine 4';

    const result = parseFreeform(text);

    expect(result.mode).toBe('heuristic');
    expect(result.instructions.length).toBeGreaterThanOrEqual(4);
  });

  it('drops empty lines', () => {
    const text = `Title



Ingredients:
- Flour


- Sugar`;

    const result = parseFreeform(text);

    expect(result.title).toBe('Title');
    expect(result.ingredients).toEqual(['Flour', 'Sugar']);
  });

  it('never throws on empty input', () => {
    expect(() => parseFreeform('')).not.toThrow();
    expect(() => parseFreeform('   ')).not.toThrow();
  });

  it('returns fallback mode for empty input', () => {
    const result = parseFreeform('');

    expect(result.mode).toBe('fallback');
    expect(result.confidence).toBe(0.1);
    expect(result.title).toBeNull();
    expect(result.ingredients).toEqual([]);
    expect(result.instructions).toEqual([]);
  });

  it('never throws on garbage input', () => {
    expect(() => parseFreeform('!@#$%^&*()')).not.toThrow();
    expect(() => parseFreeform('\n\n\n')).not.toThrow();
  });

  it('handles only whitespace', () => {
    const result = parseFreeform('   \n  \n  ');

    expect(result.mode).toBe('fallback');
    expect(result.ingredients).toEqual([]);
    expect(result.instructions).toEqual([]);
  });

  it('handles alternative instruction headers', () => {
    const text = `Ingredients:
- Flour

Method:
- Mix

Steps:
- Bake`;

    const result = parseFreeform(text);

    expect(result.mode).toBe('explicit-sections');
    expect(result.ingredients).toEqual(['Flour']);
    expect(result.instructions.length).toBeGreaterThan(0);
  });

  it('handles multiple ingredient sections', () => {
    const text = `Ingredients:
- Flour

Instructions:
- Mix

Ingredients:
- More flour`;

    const result = parseFreeform(text);

    expect(result.mode).toBe('explicit-sections');
    // Should collect ingredients from first section
    expect(result.ingredients).toContain('Flour');
  });

  it('detects ingredient-like lines with units', () => {
    const text = `2 cups flour
1 tbsp sugar
3 oz butter
Mix everything`;

    const result = parseFreeform(text);

    expect(result.mode).toBe('heuristic');
    // Should detect ingredient-heavy pattern
    expect(result.ingredients.length).toBeGreaterThan(0);
  });

  it('detects ingredient-like lines with fractions', () => {
    const text = `1/2 cup flour
1 1/2 cups sugar
Mix and bake`;

    const result = parseFreeform(text);

    expect(result.mode).toBe('heuristic');
    expect(result.ingredients.length).toBeGreaterThan(0);
  });
});

