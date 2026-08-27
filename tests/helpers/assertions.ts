/**
 * Custom Assertion Helpers for PlateUp E2E Tests
 */

import assert from 'node:assert';

export function assertRoughlyEqual(actual: number, expected: number, tolerance: number = 0.05, msg?: string) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tolerance, `${msg || 'Values differ'}: expected ${expected} ± ${tolerance}, got ${actual}`);
}

export function assertContains<T>(array: T[], item: T, msg?: string) {
  assert.ok(array.includes(item), `${msg || 'Array does not contain item'}: ${JSON.stringify(item)} in ${JSON.stringify(array)}`);
}

export function assertArraySubset<T>(subset: T[], superset: T[], msg?: string) {
  for (const item of subset) {
    assert.ok(superset.includes(item), `${msg || 'Array is missing required element'}: ${JSON.stringify(item)}`);
  }
}

export function assertValidISOWeek(isoWeek: string) {
  assert.match(isoWeek, /^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/, `Invalid ISO week format: ${isoWeek}`);
}

export function assertValidOKLCHColor(colorStr: string) {
  // Check if string contains oklch or valid hex color
  const isValid = colorStr.startsWith('oklch(') || colorStr.startsWith('#') || colorStr.startsWith('rgb');
  assert.ok(isValid, `Invalid color token: ${colorStr}`);
}

export function assertMobileViewportCompliant(cssClassesOrStyles: string[]) {
  // Asserts that standard responsive layout classes or overflow wrappers are used
  const hasNoHorizontalOverflow = cssClassesOrStyles.some(cls => 
    cls.includes('max-w-') || cls.includes('overflow-x-hidden') || cls.includes('w-full') || cls.includes('px-')
  );
  assert.ok(hasNoHorizontalOverflow, 'Component lacks mobile viewport container constraints');
}
