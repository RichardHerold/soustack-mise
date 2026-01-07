'use client';

import type { SoustackLiteRecipe } from '@/lib/mise/types';
import { isStackEnabled, migrateVersionedStackKeys } from '@/lib/mise/stacks';

type MiseCheckPanelProps = {
  recipe: SoustackLiteRecipe;
};

type CheckItem = {
  id: string;
  severity: 'info' | 'warning';
  message: string;
};

/**
 * Pure function to compute validation checks for a recipe.
 * Returns an array of check items based on profile, stacks, and field presence.
 * Uses only unversioned stack keys (canonical convention).
 */
export function computeMiseChecks(recipe: SoustackLiteRecipe): CheckItem[] {
  const checks: CheckItem[] = [];
  const stacks = recipe.stacks || {};

  // Check for legacy versioned keys (pre-migration)
  const hasLegacyKeys = Object.keys(stacks).some((key) => key.includes('@'));
  if (hasLegacyKeys) {
    checks.push({
      id: 'legacy-stack-keys',
      severity: 'info',
      message: 'Legacy stack keys were migrated to unversioned format.',
    });
  }

  // Check 1: Prep enabled but miseEnPlace empty
  if (isStackEnabled(stacks, 'prep')) {
    const recipeWithMiseEnPlace = recipe as SoustackLiteRecipe & {
      miseEnPlace?: Array<{ text: string }>;
    };
    const miseEnPlace = recipeWithMiseEnPlace.miseEnPlace;
    const isEmpty =
      !miseEnPlace ||
      !Array.isArray(miseEnPlace) ||
      miseEnPlace.length === 0 ||
      miseEnPlace.every(
        (item) =>
          !item ||
          (typeof item === 'object' && (!('text' in item) || !item.text || String(item.text).trim() === ''))
      );
    if (isEmpty) {
      checks.push({
        id: 'prep-empty',
        severity: 'info',
        message: 'Prep stack is enabled but mise en place list is empty. Consider adding preparation steps.',
      });
    }
  }

  // Check 2: Storage enabled but missing duration/method
  if (isStackEnabled(stacks, 'storage')) {
    const recipeWithStorage = recipe as SoustackLiteRecipe & {
      storage?: {
        refrigerated?: { duration?: { iso8601?: string } };
        frozen?: { duration?: { iso8601?: string } };
        roomTemp?: { duration?: { iso8601?: string } };
      };
    };
    const storageData = recipeWithStorage.storage;
    const hasDuration =
      storageData &&
      typeof storageData === 'object' &&
      storageData !== null &&
      ((storageData.refrigerated?.duration?.iso8601) ||
        (storageData.frozen?.duration?.iso8601) ||
        (storageData.roomTemp?.duration?.iso8601));
    const hasMethod =
      storageData &&
      typeof storageData === 'object' &&
      storageData !== null &&
      (storageData.refrigerated || storageData.frozen || storageData.roomTemp);
    if (!hasDuration && !hasMethod) {
      checks.push({
        id: 'storage-incomplete',
        severity: 'warning',
        message: 'Storage stack is enabled but missing duration or method information.',
      });
    } else if (!hasDuration) {
      checks.push({
        id: 'storage-no-duration',
        severity: 'info',
        message: 'Storage stack is enabled but missing duration information.',
      });
    } else if (!hasMethod) {
      checks.push({
        id: 'storage-no-method',
        severity: 'info',
        message: 'Storage stack is enabled but missing storage method/location.',
      });
    }
  }

  // Check 3: Timed enabled but instructions are plain strings
  if (isStackEnabled(stacks, 'timed')) {
    const instructions = recipe.instructions || [];
    const hasPlainStrings = instructions.some((inst) => typeof inst === 'string');
    const hasStructured = instructions.some(
      (inst) =>
        inst &&
        typeof inst === 'object' &&
        ('duration' in inst || 'time' in inst || 'timer' in inst)
    );
    if (hasPlainStrings && !hasStructured) {
      const hasStructuredStack = isStackEnabled(stacks, 'structured');
      checks.push({
        id: 'timed-plain-strings',
        severity: hasStructuredStack ? 'info' : 'warning',
        message: hasStructuredStack
          ? 'Timed stack is enabled but instructions contain plain strings. Consider converting steps to structured format with timing information.'
          : 'Timed stack is enabled but instructions are plain strings. Consider enabling structured stack or converting steps to include timing information.',
      });
    }
  }

  // Check 4: Referenced enabled but structured steps missing inputs[]
  if (isStackEnabled(stacks, 'referenced')) {
    const instructions = recipe.instructions || [];
    const hasStructuredSteps = instructions.some(
      (inst) => inst && typeof inst === 'object' && ('text' in inst || 'instruction' in inst)
    );
    if (hasStructuredSteps) {
      const missingInputs = instructions.some(
        (inst) =>
          inst &&
          typeof inst === 'object' &&
          ('text' in inst || 'instruction' in inst) &&
          (!('inputs' in inst) ||
            !Array.isArray(inst.inputs) ||
            (Array.isArray(inst.inputs) && inst.inputs.length === 0))
      );
      if (missingInputs) {
        checks.push({
          id: 'referenced-missing-inputs',
          severity: 'warning',
          message: 'Referenced stack is enabled but some structured steps are missing inputs[] array.',
        });
      }
    } else {
      checks.push({
        id: 'referenced-no-structured',
        severity: 'info',
        message: 'Referenced stack is enabled but instructions are not in structured format. Consider converting steps to structured format with inputs[].',
      });
    }
  }

  // Check 5: Equipment enabled but equipment list missing
  if (isStackEnabled(stacks, 'equipment')) {
    // Equipment data is not stored in a top-level field yet, so we check stacks
    // This is a placeholder check - equipment data structure may be defined elsewhere
    const equipmentData = stacks.equipment;
    const isEmpty =
      equipmentData === undefined ||
      equipmentData === null ||
      (Array.isArray(equipmentData) && equipmentData.length === 0) ||
      (Array.isArray(equipmentData) &&
        equipmentData.every(
          (item) =>
            !item ||
            (typeof item === 'object' && (!('name' in item) || !item.name || String(item.name).trim() === '')) ||
            (typeof item === 'string' && item.trim() === '')
        ));
    if (isEmpty) {
      checks.push({
        id: 'equipment-empty',
        severity: 'info',
        message: 'Equipment stack is enabled but equipment list is empty. Consider adding required equipment.',
      });
    }
  }

  // Check 6: Structured stack enabled but instructions are plain strings
  if (isStackEnabled(stacks, 'structured')) {
    const instructions = recipe.instructions || [];
    const hasPlainStrings = instructions.some((inst) => typeof inst === 'string');
    if (hasPlainStrings) {
      checks.push({
        id: 'structured-plain-strings',
        severity: 'info',
        message: 'Structured stack is enabled but instructions contain plain strings. Consider converting steps to structured format.',
      });
    }
  }

  return checks;
}

/**
 * MiseCheckPanel - Advisory validation checklist
 * Only visible when miseMode === "mise"
 * Shows guidance items based on profile, stacks, and field presence
 */
export default function MiseCheckPanel({ recipe }: MiseCheckPanelProps) {
  const checks = computeMiseChecks(recipe);

  if (checks.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          border: '1px solid #d1fae5',
          borderRadius: '4px',
          backgroundColor: '#f0fdf4',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }}>✓</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#065f46',
            }}
          >
            All checks passed
          </span>
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#047857',
          }}
        >
          Your recipe structure looks good!
        </div>
      </div>
    );
  }

  const warnings = checks.filter((c) => c.severity === 'warning');
  const infos = checks.filter((c) => c.severity === 'info');

  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#fafafa',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '12px',
          color: '#333',
        }}
      >
        Advisory Checklist
      </div>
      {warnings.length > 0 && (
        <div style={{ marginBottom: infos.length > 0 ? '16px' : '0' }}>
          {warnings.map((check) => (
            <div
              key={check.id}
              style={{
                display: 'flex',
                gap: '8px',
                padding: '8px 12px',
                marginBottom: '8px',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '4px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '14px', color: '#92400e', flexShrink: 0 }}>⚠</span>
              <span
                style={{
                  fontSize: '13px',
                  color: '#92400e',
                  lineHeight: '1.5',
                }}
              >
                {check.message}
              </span>
            </div>
          ))}
        </div>
      )}
      {infos.length > 0 && (
        <div>
          {infos.map((check) => (
            <div
              key={check.id}
              style={{
                display: 'flex',
                gap: '8px',
                padding: '8px 12px',
                marginBottom: '8px',
                backgroundColor: '#eff6ff',
                border: '1px solid #3b82f6',
                borderRadius: '4px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '14px', color: '#1e40af', flexShrink: 0 }}>ℹ</span>
              <span
                style={{
                  fontSize: '13px',
                  color: '#1e40af',
                  lineHeight: '1.5',
                }}
              >
                {check.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

