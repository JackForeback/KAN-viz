/**
 * math.test.js — Tests for the KAN visualization math module.
 *
 * Verifies:
 *   1. Individual Chebyshev polynomial evaluation at known values
 *   2. evaluateAllBasis consistency
 *   3. Weighted activation summation
 *   4. Formula string generation
 *   5. Edge cases: NaN, all-zero coefficients, extreme x values
 *   6. Sampling functions produce correct array shapes
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateChebyshev,
  evaluateAllBasis,
  NUM_BASIS,
} from '../src/math/basis.js';
import {
  computeActivation,
  buildFormulaString,
} from '../src/math/activation.js';
import {
  generateXValues,
  sampleBasisFunctions,
  sampleActivation,
} from '../src/math/sampling.js';

// =========================================================================
// 1. Chebyshev polynomial evaluation at known values
// =========================================================================
// Reference values from the Chebyshev recurrence:
//   T_0(x) = 1
//   T_1(x) = x
//   T_2(x) = 2x^2 - 1
//   T_3(x) = 4x^3 - 3x
//   T_4(x) = 8x^4 - 8x^2 + 1

describe('evaluateChebyshev', () => {
  it('T_0(x) = 1 for any x', () => {
    expect(evaluateChebyshev(0, 0)).toBe(1);
    expect(evaluateChebyshev(0, 0.5)).toBe(1);
    expect(evaluateChebyshev(0, -1)).toBe(1);
    expect(evaluateChebyshev(0, 100)).toBe(1);
  });

  it('T_1(x) = x', () => {
    expect(evaluateChebyshev(1, 0)).toBe(0);
    expect(evaluateChebyshev(1, 0.5)).toBe(0.5);
    expect(evaluateChebyshev(1, -1)).toBe(-1);
  });

  it('T_2(x) = 2x^2 - 1', () => {
    // T_2(0) = -1, T_2(0.5) = 2*0.25 - 1 = -0.5, T_2(1) = 1
    expect(evaluateChebyshev(2, 0)).toBe(-1);
    expect(evaluateChebyshev(2, 0.5)).toBeCloseTo(-0.5);
    expect(evaluateChebyshev(2, 1)).toBe(1);
  });

  it('T_3(x) = 4x^3 - 3x', () => {
    // T_3(0) = 0, T_3(0.5) = 4*0.125 - 1.5 = -1, T_3(1) = 1
    expect(evaluateChebyshev(3, 0)).toBeCloseTo(0);
    expect(evaluateChebyshev(3, 0.5)).toBeCloseTo(-1);
    expect(evaluateChebyshev(3, 1)).toBe(1);
  });

  it('T_4(x) = 8x^4 - 8x^2 + 1', () => {
    // T_4(0) = 1, T_4(0.5) = 8*0.0625 - 8*0.25 + 1 = 0.5 - 2 + 1 = -0.5
    expect(evaluateChebyshev(4, 0)).toBe(1);
    expect(evaluateChebyshev(4, 0.5)).toBeCloseTo(-0.5);
    expect(evaluateChebyshev(4, 1)).toBe(1);
  });

  it('handles NaN input gracefully — returns 0', () => {
    expect(evaluateChebyshev(2, NaN)).toBe(0);
  });

  it('clamps degree to [0, 4]', () => {
    // Degree -1 should be clamped to 0 -> T_0 = 1
    expect(evaluateChebyshev(-1, 0.5)).toBe(1);
    // Degree 10 should be clamped to 4 -> T_4(0.5) = -0.5
    expect(evaluateChebyshev(10, 0.5)).toBeCloseTo(-0.5);
  });
});

// =========================================================================
// 2. evaluateAllBasis consistency
// =========================================================================
describe('evaluateAllBasis', () => {
  it('returns an array of NUM_BASIS (5) values', () => {
    const result = evaluateAllBasis(0.5);
    expect(result).toHaveLength(NUM_BASIS);
  });

  it('matches individual evaluateChebyshev calls', () => {
    const x = 0.7;
    const all = evaluateAllBasis(x);
    for (let deg = 0; deg < NUM_BASIS; deg++) {
      expect(all[deg]).toBeCloseTo(evaluateChebyshev(deg, x));
    }
  });

  it('returns all zeros for NaN input', () => {
    const result = evaluateAllBasis(NaN);
    expect(result).toEqual([0, 0, 0, 0, 0]);
  });
});

// =========================================================================
// 3. Activation summation
// =========================================================================
describe('computeActivation', () => {
  it('with single non-zero coefficient, returns c * T_n(x)', () => {
    // Only c_2 = 3 -> f(0.5) = 3 * T_2(0.5) = 3 * (-0.5) = -1.5
    const coeffs = [0, 0, 3, 0, 0];
    expect(computeActivation(coeffs, 0.5)).toBeCloseTo(-1.5);
  });

  it('sums multiple basis functions correctly', () => {
    // c_0=1, c_1=2 -> f(0.5) = 1*T_0(0.5) + 2*T_1(0.5) = 1 + 1 = 2
    const coeffs = [1, 2, 0, 0, 0];
    expect(computeActivation(coeffs, 0.5)).toBeCloseTo(2);
  });

  it('all-zero coefficients return 0', () => {
    const coeffs = [0, 0, 0, 0, 0];
    expect(computeActivation(coeffs, 0.5)).toBe(0);
    expect(computeActivation(coeffs, 0)).toBe(0);
    expect(computeActivation(coeffs, -1)).toBe(0);
  });

  it('handles invalid coefficient array gracefully', () => {
    expect(computeActivation([], 0.5)).toBe(0);
    expect(computeActivation(null, 0.5)).toBe(0);
    expect(computeActivation([1, 2], 0.5)).toBe(0);
  });

  it('handles NaN coefficient by treating it as 0', () => {
    const coeffs = [1, NaN, 0, 0, 0];
    // Only c_0=1 contributes: f(0.5) = 1 * T_0(0.5) = 1
    expect(computeActivation(coeffs, 0.5)).toBeCloseTo(1);
  });

  it('handles extreme x values without crashing', () => {
    const coeffs = [1, 1, 1, 1, 1];
    // x = 1000 should produce a finite number (Chebyshev grows polynomially)
    const result = computeActivation(coeffs, 1000);
    expect(Number.isFinite(result)).toBe(true);
  });
});

// =========================================================================
// 4. Formula string
// =========================================================================
describe('buildFormulaString', () => {
  it('shows all terms with non-zero coefficients', () => {
    const formula = buildFormulaString([1, 0.5, -0.3, 0, 0]);
    expect(formula).toContain('T₀');
    expect(formula).toContain('T₁');
    expect(formula).toContain('T₂');
    expect(formula).not.toContain('T₃');
    expect(formula).not.toContain('T₄');
    expect(formula).toContain('-');
  });

  it('returns "f(x) = 0" for all-zero coefficients', () => {
    expect(buildFormulaString([0, 0, 0, 0, 0])).toBe('f(x) = 0');
  });

  it('returns "f(x) = 0" for invalid input', () => {
    expect(buildFormulaString(null)).toBe('f(x) = 0');
    expect(buildFormulaString([])).toBe('f(x) = 0');
  });
});

// =========================================================================
// 5. Sampling
// =========================================================================
describe('generateXValues', () => {
  it('generates correct number of points', () => {
    const xs = generateXValues(-1, 1, 50);
    expect(xs).toHaveLength(50);
  });

  it('endpoints match min and max', () => {
    const xs = generateXValues(-1, 1, 100);
    expect(xs[0]).toBeCloseTo(-1);
    expect(xs[99]).toBeCloseTo(1);
  });
});

describe('sampleBasisFunctions', () => {
  it('returns NUM_BASIS traces', () => {
    const traces = sampleBasisFunctions();
    expect(traces).toHaveLength(NUM_BASIS);
    traces.forEach((trace) => {
      expect(trace.x.length).toBeGreaterThan(0);
      expect(trace.y.length).toBe(trace.x.length);
      expect(typeof trace.name).toBe('string');
    });
  });
});

describe('sampleActivation', () => {
  it('returns x and y arrays of equal length', () => {
    const { x, y } = sampleActivation([1, 0, 0, 0, 0]);
    expect(x.length).toBe(y.length);
    expect(x.length).toBeGreaterThan(0);
  });

  it('all-zero coefficients produce all-zero y values', () => {
    const { y } = sampleActivation([0, 0, 0, 0, 0]);
    y.forEach((val) => expect(val).toBe(0));
  });
});
