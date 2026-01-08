import { useState, useCallback } from 'react';
import type { SoustackLiteRecipe } from '@/lib/mise/types';

type ConversionState =
  | { status: 'idle' }
  | { status: 'converting' }
  | { status: 'success'; recipe: SoustackLiteRecipe }
  | { status: 'error'; message: string };

export function useRecipeConverter() {
  const [state, setState] = useState<ConversionState>({ status: 'idle' });

  const convert = useCallback(async (text: string) => {
    if (!text || text.trim().length === 0) {
      setState({
        status: 'error',
        message: 'Text cannot be empty',
      });
      return;
    }

    setState({ status: 'converting' });

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Failed to convert recipe',
        }));
        setState({
          status: 'error',
          message: errorData.error || `Server error: ${response.status}`,
        });
        return;
      }

      const recipe: SoustackLiteRecipe = await response.json();
      setState({
        status: 'success',
        recipe,
      });
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to convert recipe',
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return {
    state,
    convert,
    reset,
  };
}
