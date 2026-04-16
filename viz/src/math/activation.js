/**
 * activation.js — Computes the weighted sum of Chebyshev basis functions.
 *
 * Each KAN edge has an activation function defined as:
 *   f(x) = c_0 * T_0(x) + c_1 * T_1(x) + c_2 * T_2(x) + c_3 * T_3(x) + c_4 * T_4(x)
 *
 * This module takes a coefficient array [c_0, ..., c_4] and produces
 * the combined activation value at a given x.
 *
 * Data flow:
 *   slider onChange -> state update (coefficients change)
 *   -> this module recomputes the activation
 *   -> Plotly redraws the curve
 */

import { evaluateAllBasis, NUM_BASIS } from './basis.js';

/**
 * Compute the weighted activation f(x) = sum( coefficients[i] * T_i(x) ).
 *
 * @param {number[]} coefficients - Array of NUM_BASIS coefficients [c_0, ..., c_4].
 * @param {number} x              - Input value.
 * @returns {number} The activation value. Returns 0 for degenerate inputs.
 */
export function computeActivation(coefficients, x) {
  // Validate coefficients array
  if (!Array.isArray(coefficients) || coefficients.length !== NUM_BASIS) {
    console.error(
      `activation.js: expected ${NUM_BASIS} coefficients, got`,
      coefficients
    );
    return 0;
  }

  const basisValues = evaluateAllBasis(x);

  // Dot product: sum of c_i * T_i(x)
  let sum = 0;
  for (let i = 0; i < NUM_BASIS; i++) {
    const c = coefficients[i];
    // Treat NaN coefficients as 0 — don't let one bad slider crash the chart
    if (Number.isNaN(c)) {
      console.error(`activation.js: coefficient[${i}] is NaN, treating as 0`);
      continue;
    }
    sum += c * basisValues[i];
  }

  // Guard against Infinity from extreme x values combined with large coefficients
  if (!Number.isFinite(sum)) {
    return 0;
  }

  return sum;
}

/**
 * Build a human-readable formula string showing the current activation.
 *
 * Example output: "f(x) = 1.00 T₀ + 0.50 T₁ - 0.30 T₂"
 * Terms with coefficient === 0 are omitted for clarity.
 *
 * @param {number[]} coefficients - Array of NUM_BASIS coefficients.
 * @returns {string} The formula string.
 */
export function buildFormulaString(coefficients) {
  if (!Array.isArray(coefficients) || coefficients.length !== NUM_BASIS) {
    return 'f(x) = 0';
  }

  const labels = ['T₀', 'T₁', 'T₂', 'T₃', 'T₄'];
  const terms = [];

  for (let i = 0; i < NUM_BASIS; i++) {
    const c = coefficients[i];
    // Skip zero coefficients to keep the formula clean
    if (c === 0) continue;

    const absC = Math.abs(c);
    const sign = c < 0 ? '- ' : terms.length > 0 ? '+ ' : '';
    const valueStr = absC === 1 ? '' : absC.toFixed(2) + ' ';
    terms.push(`${sign}${valueStr}${labels[i]}`);
  }

  if (terms.length === 0) return 'f(x) = 0';
  return `f(x) = ${terms.join(' ')}`;
}
