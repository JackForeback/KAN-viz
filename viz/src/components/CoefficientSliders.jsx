/**
 * CoefficientSliders.jsx — Five sliders controlling Chebyshev basis coefficients.
 *
 * Each slider controls one coefficient c_i in the activation:
 *   f(x) = c_0*T_0(x) + c_1*T_1(x) + c_2*T_2(x) + c_3*T_3(x) + c_4*T_4(x)
 *
 * Data flow:
 *   slider onChange -> calls props.onCoefficientChange(index, value)
 *   -> parent updates state via setCoefficient
 *   -> math module recomputes activation
 *   -> Plotly redraws the curve
 *
 * Range: [-2, 2] with step 0.01 for smooth real-time updates.
 */

import React from 'react';
import { BASIS_LABELS } from '../math/basis.js';

/** @constant {number} Minimum slider value */
const SLIDER_MIN = -2;

/** @constant {number} Maximum slider value */
const SLIDER_MAX = 2;

/** @constant {number} Slider step size (0.01 for smooth dragging) */
const SLIDER_STEP = 0.01;

/**
 * CoefficientSliders component.
 *
 * @param {object} props
 * @param {number[]} props.coefficients            - Current coefficient values [c0..c4].
 * @param {function} props.onCoefficientChange     - Callback: (index, value) => void.
 */
export default function CoefficientSliders({ coefficients, onCoefficientChange }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
        Basis Coefficients
      </h3>
      {coefficients.map((value, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
          }}
        >
          {/* Label: which Chebyshev polynomial this slider controls */}
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              minWidth: '30px',
              color: '#4b5563',
            }}
          >
            {BASIS_LABELS[index]}
          </span>

          {/* The range slider — onChange fires on every drag movement for real-time updates */}
          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            value={value}
            onChange={(e) => onCoefficientChange(index, parseFloat(e.target.value))}
            style={{ flex: 1, cursor: 'pointer' }}
          />

          {/* Numeric display of current value */}
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              minWidth: '45px',
              textAlign: 'right',
              color: '#6b7280',
            }}
          >
            {value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
