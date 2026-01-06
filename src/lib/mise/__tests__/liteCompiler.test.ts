import { compileLiteRecipe } from '../liteCompiler';
import type { SoustackLiteRecipe } from '../types';

describe('compileLiteRecipe', () => {
  it('returns required keys', () => {
    const result = compileLiteRecipe({});

    expect(result).toHaveProperty('$schema');
    expect(result).toHaveProperty('profile', 'lite');
    expect(result).toHaveProperty('stacks');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('ingredients');
    expect(result).toHaveProperty('instructions');
  });

  it('applies placeholders when name is missing', () => {
    const result = compileLiteRecipe({});

    expect(result.name).toBe('Untitled Recipe');
  });

  it('applies placeholders when ingredients are missing', () => {
    const result = compileLiteRecipe({});

    expect(result.ingredients).toEqual(['(not provided)']);
  });

  it('applies placeholders when instructions are missing', () => {
    const result = compileLiteRecipe({});

    expect(result.instructions).toEqual(['(not provided)']);
  });

  it('uses provided name', () => {
    const result = compileLiteRecipe({ name: 'Chocolate Cake' });

    expect(result.name).toBe('Chocolate Cake');
  });

  it('uses provided ingredients', () => {
    const result = compileLiteRecipe({
      ingredients: ['2 cups flour', '1 cup sugar'],
    });

    expect(result.ingredients).toEqual(['2 cups flour', '1 cup sugar']);
  });

  it('uses provided instructions', () => {
    const result = compileLiteRecipe({
      instructions: ['Mix ingredients', 'Bake at 350F'],
    });

    expect(result.instructions).toEqual(['Mix ingredients', 'Bake at 350F']);
  });

  it('trims whitespace from name', () => {
    const result = compileLiteRecipe({ name: '  Chocolate Cake  ' });

    expect(result.name).toBe('Chocolate Cake');
  });

  it('filters empty ingredients', () => {
    const result = compileLiteRecipe({
      ingredients: ['2 cups flour', '', '   ', '1 cup sugar'],
    });

    expect(result.ingredients).toEqual(['2 cups flour', '1 cup sugar']);
  });

  it('filters empty instructions', () => {
    const result = compileLiteRecipe({
      instructions: ['Mix ingredients', '', '   ', 'Bake at 350F'],
    });

    expect(result.instructions).toEqual(['Mix ingredients', 'Bake at 350F']);
  });

  it('includes x-mise metadata when meta is provided', () => {
    const result = compileLiteRecipe({
      name: 'Test Recipe',
      meta: { confidence: 0.85, mode: 'explicit-sections' },
    });

    expect(result['x-mise']).toEqual({
      parse: {
        confidence: 0.85,
        mode: 'explicit-sections',
      },
    });
  });

  it('does not include x-mise when meta is not provided', () => {
    const result = compileLiteRecipe({ name: 'Test Recipe' });

    expect(result['x-mise']).toBeUndefined();
  });

  it('handles null values gracefully', () => {
    const result = compileLiteRecipe({
      name: null,
      ingredients: null,
      instructions: null,
    });

    expect(result.name).toBe('Untitled Recipe');
    expect(result.ingredients).toEqual(['(not provided)']);
    expect(result.instructions).toEqual(['(not provided)']);
  });

  it('does not throw on weird inputs', () => {
    expect(() => {
      compileLiteRecipe({
        name: '',
        ingredients: [],
        instructions: [],
      });
    }).not.toThrow();

    expect(() => {
      compileLiteRecipe({
        name: null,
        ingredients: null,
        instructions: null,
        meta: { confidence: -1, mode: '' },
      });
    }).not.toThrow();
  });

  it('uses default values for missing meta fields', () => {
    const result = compileLiteRecipe({
      meta: {},
    });

    expect(result['x-mise']).toEqual({
      parse: {
        confidence: 0.0,
        mode: 'unknown',
      },
    });
  });

  it('always returns valid Soustack Lite recipe structure', () => {
    const result = compileLiteRecipe({});

    // Verify structure matches SoustackLiteRecipe type
    expect(result.$schema).toBe('https://soustack.spec/soustack.schema.json');
    expect(result.profile).toBe('lite');
    expect(result.stacks).toEqual({});
    expect(Array.isArray(result.ingredients)).toBe(true);
    expect(Array.isArray(result.instructions)).toBe(true);
    expect(typeof result.name).toBe('string');
  });
});

