/**
 * basis.js — Chebyshev polynomial evaluation for KAN edge activations.
 *
 * Chebyshev polynomials of the first kind (T_n) are orthogonal polynomials
 * defined on [-1, 1]. They satisfy the recurrence:
 *   T_0(x) = 1
 *   T_1(x) = x
 *   T_n(x) = 2x * T_{n-1}(x) - T_{n-2}(x)
 *
 * We use degrees 0 through 4 as the basis functions for each KAN edge.
 * Each edge's activation is a weighted sum: f(x) = sum( c_i * T_i(x) ).
 */

/**
 * Number of basis functions used per edge (Chebyshev degrees 0-4).
 * @constant {number}
 */
export const NUM_BASIS = 5;

/**
 * Human-readable labels for each basis function, used in chart legends
 * and formula display.
 * @constant {string[]}
 */
export const BASIS_LABELS = ['T₀', 'T₁', 'T₂', 'T₃', 'T₄'];

/**
 * Evaluate Chebyshev polynomial T_n(x) for a single x value.
 *
 * Uses the recurrence relation rather than the trig definition
 * (T_n(x) = cos(n * arccos(x))) because:
 *   1. It avoids domain issues for |x| > 1
 *   2. It's numerically stable for low degrees
 *
 * @param {number} degree - Polynomial degree (0-4). Clamped to [0, 4].
 * @param {number} x      - Input value (typically in [-1, 1]).
 * @returns {number} T_degree(x). Returns 0 if x is NaN.
 */
export function evaluateChebyshev(degree, x) {
  // Guard: NaN input should not crash charts — return 0 silently
  if (Number.isNaN(x)) {
    console.error('basis.js: evaluateChebyshev received NaN input');
    return 0;
  }

  // Clamp degree to valid range
  const n = Math.max(0, Math.min(4, Math.floor(degree)));

  if (n === 0) return 1;
  if (n === 1) return x;

  // Recurrence: T_n = 2x * T_{n-1} - T_{n-2}
  let prev2 = 1;   // T_0
  let prev1 = x;   // T_1
  for (let i = 2; i <= n; i++) {
    const current = 2 * x * prev1 - prev2;
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
}

/**
 * Evaluate ALL basis functions (T_0 through T_4) at a single x value.
 *
 * @param {number} x - Input value.
 * @returns {number[]} Array of 5 values: [T_0(x), T_1(x), T_2(x), T_3(x), T_4(x)].
 */
export function evaluateAllBasis(x) {
  if (Number.isNaN(x)) {
    console.error('basis.js: evaluateAllBasis received NaN input');
    return new Array(NUM_BASIS).fill(0);
  }

  const values = [1, x, 0, 0, 0];

  // Build up using the recurrence
  for (let i = 2; i < NUM_BASIS; i++) {
    values[i] = 2 * x * values[i - 1] - values[i - 2];
  }

  return values;
}
