/**
 * sampling.js — Generates x-value arrays and samples curves for Plotly traces.
 *
 * This module bridges the math functions and the Plotly charting library.
 * It produces arrays of {x, y} data that Plotly can directly consume.
 *
 * Data flow:
 *   coefficients change -> sampling.js generates traces -> Plotly redraws
 */

import { evaluateAllBasis, NUM_BASIS, BASIS_LABELS } from './basis.js';
import { computeActivation } from './activation.js';

/**
 * Default x-axis range for the visualization. Chebyshev polynomials are
 * naturally defined on [-1, 1], so we use a slightly wider range to show
 * behavior near the boundaries.
 * @constant {number}
 */
export const X_MIN = -1.2;

/** @constant {number} */
export const X_MAX = 1.2;

/**
 * Number of sample points along the x-axis. 200 gives smooth curves
 * without heavy rendering cost.
 * @constant {number}
 */
export const NUM_SAMPLES = 200;

/**
 * Generate an evenly-spaced array of x values.
 *
 * @param {number} [min=X_MIN] - Start of range.
 * @param {number} [max=X_MAX] - End of range.
 * @param {number} [count=NUM_SAMPLES] - Number of points.
 * @returns {number[]} Array of evenly-spaced x values.
 */
export function generateXValues(min = X_MIN, max = X_MAX, count = NUM_SAMPLES) {
  const step = (max - min) / (count - 1);
  const xs = new Array(count);
  for (let i = 0; i < count; i++) {
    xs[i] = min + i * step;
  }
  return xs;
}

/**
 * Sample all individual basis functions across the x range.
 *
 * Returns an array of NUM_BASIS objects, each with:
 *   { x: number[], y: number[], name: string }
 *
 * These are used as faint background traces in the detail chart.
 *
 * @param {number[]} [xValues] - Pre-generated x values (optional).
 * @returns {Array<{x: number[], y: number[], name: string}>}
 */
export function sampleBasisFunctions(xValues) {
  const xs = xValues || generateXValues();
  const traces = [];

  for (let deg = 0; deg < NUM_BASIS; deg++) {
    const ys = xs.map((x) => {
      const allValues = evaluateAllBasis(x);
      return allValues[deg];
    });
    traces.push({
      x: xs,
      y: ys,
      name: BASIS_LABELS[deg],
    });
  }

  return traces;
}

/**
 * Sample the combined activation function (weighted sum of basis functions)
 * across the x range.
 *
 * @param {number[]} coefficients - Array of NUM_BASIS coefficients.
 * @param {number[]} [xValues]    - Pre-generated x values (optional).
 * @returns {{x: number[], y: number[]}} The summed activation curve.
 */
export function sampleActivation(coefficients, xValues) {
  const xs = xValues || generateXValues();
  const ys = xs.map((x) => computeActivation(coefficients, x));
  return { x: xs, y: ys };
}

/**
 * Sample the weighted individual basis functions (c_i * T_i(x)).
 * Useful for showing how each basis contributes to the total activation.
 *
 * @param {number[]} coefficients - Array of NUM_BASIS coefficients.
 * @param {number[]} [xValues]    - Pre-generated x values (optional).
 * @returns {Array<{x: number[], y: number[], name: string}>}
 */
export function sampleWeightedBasis(coefficients, xValues) {
  const xs = xValues || generateXValues();
  const traces = [];

  for (let deg = 0; deg < NUM_BASIS; deg++) {
    const c = coefficients[deg] || 0;
    const ys = xs.map((x) => {
      const allValues = evaluateAllBasis(x);
      return c * allValues[deg];
    });
    traces.push({
      x: xs,
      y: ys,
      name: `${coefficients[deg].toFixed(2)} ${BASIS_LABELS[deg]}`,
    });
  }

  return traces;
}
