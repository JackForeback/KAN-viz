/**
 * EdgeTooltip.jsx — Hover tooltip showing a KAN edge's current formula.
 *
 * When the user hovers over an edge in the KanGraph, this tooltip appears
 * near the mouse position showing the activation formula with current
 * coefficient values substituted in.
 *
 * Positioned absolutely relative to the graph container.
 */

import React from 'react';
import { buildFormulaString } from '../math/activation.js';

/**
 * EdgeTooltip component.
 *
 * @param {object} props
 * @param {object|null} props.edge  - The hovered edge object (null if none).
 * @param {string} props.edgeId     - The hovered edge's id for display.
 */
export default function EdgeTooltip({ edge }) {
  if (!edge) return null;

  const formula = buildFormulaString(edge.coefficients);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <strong>{edge.id}:</strong> {formula}
    </div>
  );
}
