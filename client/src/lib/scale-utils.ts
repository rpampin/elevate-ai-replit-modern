import type { Scale } from "@shared/schema";

export interface ScaleValue {
  value: string;
  order: number;
}

/**
 * Get the order value for a specific scale value
 */
export function getScaleOrder(scale: Scale, value: string): number {
  if (scale.type === "numeric") {
    return parseInt(value) || 0;
  }
  
  const scaleValues = scale.values as ScaleValue[];
  const found = scaleValues.find(sv => sv.value === value);
  return found ? found.order : 0;
}

/**
 * Compare two scale values for ranking/sorting
 * Returns positive if a > b, negative if a < b, 0 if equal
 */
export function compareScaleValues(scale: Scale, valueA: string, valueB: string): number {
  const orderA = getScaleOrder(scale, valueA);
  const orderB = getScaleOrder(scale, valueB);
  return orderA - orderB;
}

/**
 * Get all scale values sorted by their order
 */
export function getSortedScaleValues(scale: Scale): string[] {
  if (scale.type === "numeric") {
    return (scale.values as string[]).sort((a, b) => parseInt(a) - parseInt(b));
  }
  
  const scaleValues = scale.values as ScaleValue[];
  return scaleValues
    .sort((a, b) => a.order - b.order)
    .map(sv => sv.value);
}

/**
 * Get the highest level value for a scale
 */
export function getHighestScaleValue(scale: Scale): string {
  const sorted = getSortedScaleValues(scale);
  return sorted[sorted.length - 1] || "";
}

/**
 * Get the lowest level value for a scale
 */
export function getLowestScaleValue(scale: Scale): string {
  const sorted = getSortedScaleValues(scale);
  return sorted[0] || "";
}

/**
 * Check if value A is higher than value B on the scale
 */
export function isHigherLevel(scale: Scale, valueA: string, valueB: string): boolean {
  return compareScaleValues(scale, valueA, valueB) > 0;
}

/**
 * Get the next higher level from current value
 */
export function getNextHigherLevel(scale: Scale, currentValue: string): string | null {
  const sorted = getSortedScaleValues(scale);
  const currentIndex = sorted.indexOf(currentValue);
  
  if (currentIndex === -1 || currentIndex === sorted.length - 1) {
    return null;
  }
  
  return sorted[currentIndex + 1];
}

/**
 * Calculate skill level percentage (0-100) based on scale position
 */
export function getSkillLevelPercentage(scale: Scale, value: string): number {
  const sorted = getSortedScaleValues(scale);
  const index = sorted.indexOf(value);
  
  if (index === -1 || sorted.length <= 1) {
    return 0;
  }
  
  return Math.round((index / (sorted.length - 1)) * 100);
}