/**
 * DetailPanel.jsx — Detailed view of a selected KAN edge's activation function.
 *
 * Shows three things:
 *   1. A Plotly chart with:
 *      - Faint lines for each individual basis function (T_0 through T_4),
 *        scaled by their current coefficient (c_i * T_i(x))
 *      - A bold line for the summed activation f(x) = sum(c_i * T_i(x))
 *   2. The live formula string with current coefficient values
 *   3. Five sliders (via CoefficientSliders) to adjust each coefficient
 *
 * Data flow:
 *   slider onChange
 *     -> onCoefficientChange(edgeId, index, value)
 *     -> state update in useKanState
 *     -> new coefficients flow into this component as props
 *     -> math module recomputes curves
 *     -> Plotly redraws
 */

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import CoefficientSliders from './CoefficientSliders.jsx';
import { buildFormulaString } from '../math/activation.js';
import { generateXValues, sampleWeightedBasis, sampleActivation } from '../math/sampling.js';
import { NUM_BASIS } from '../math/basis.js';

/**
 * Colors for each basis function trace (faint background lines).
 * Using a muted palette so they don't overpower the bold sum line.
 */
const BASIS_COLORS = [
  'rgba(239, 68, 68, 0.35)',    // red
  'rgba(249, 115, 22, 0.35)',   // orange
  'rgba(34, 197, 94, 0.35)',    // green
  'rgba(59, 130, 246, 0.35)',   // blue
  'rgba(168, 85, 247, 0.35)',   // purple
];

/**
 * DetailPanel component.
 *
 * @param {object} props
 * @param {object|null} props.edge - The selected edge object, or null if none.
 * @param {function} props.onCoefficientChange - Callback: (edgeId, index, value) => void.
 */
export default function DetailPanel({ edge, onCoefficientChange }) {
  // Pre-compute x values once (they don't depend on coefficients)
  const xValues = useMemo(() => generateXValues(), []);

  // Recompute chart data whenever coefficients change
  const { basisTraces, activationTrace } = useMemo(() => {
    if (!edge) return { basisTraces: [], activationTrace: null };

    const weighted = sampleWeightedBasis(edge.coefficients, xValues);
    const activation = sampleActivation(edge.coefficients, xValues);

    return { basisTraces: weighted, activationTrace: activation };
  }, [edge, xValues]);

  if (!edge) {
    return (
      <div style={{ padding: '20px', color: '#9ca3af', textAlign: 'center' }}>
        Click an edge in the graph to see its activation function.
      </div>
    );
  }

  const formula = buildFormulaString(edge.coefficients);

  // Build Plotly data: faint basis lines + bold activation line
  const plotData = [
    // Individual weighted basis functions (faint background)
    ...basisTraces.map((trace, i) => ({
      x: trace.x,
      y: trace.y,
      type: 'scattergl',
      mode: 'lines',
      name: trace.name,
      line: { color: BASIS_COLORS[i], width: 1.5, dash: 'dot' },
      hoverinfo: 'name+y',
    })),
    // Summed activation (bold foreground)
    ...(activationTrace
      ? [
          {
            x: activationTrace.x,
            y: activationTrace.y,
            type: 'scattergl',
            mode: 'lines',
            name: 'f(x)',
            line: { color: '#2563eb', width: 3 },
            hoverinfo: 'name+y',
          },
        ]
      : []),
  ];

  const plotLayout = {
    title: { text: `Edge ${edge.id} Activation`, font: { size: 14 } },
    xaxis: {
      title: 'x',
      range: [-1.3, 1.3],
      zeroline: true,
      zerolinecolor: '#e5e7eb',
    },
    yaxis: {
      title: 'f(x)',
      zeroline: true,
      zerolinecolor: '#e5e7eb',
    },
    margin: { l: 50, r: 20, t: 40, b: 40 },
    showlegend: true,
    legend: { x: 0, y: 1.15, orientation: 'h', font: { size: 11 } },
    paper_bgcolor: 'transparent',
    plot_bgcolor: '#fafafa',
    height: 320,
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* Plotly chart: faint basis functions + bold summed activation */}
      <Plot
        data={plotData}
        layout={plotLayout}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%' }}
      />

      {/* Live formula display */}
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '15px',
          padding: '10px 12px',
          margin: '8px 0',
          background: '#f3f4f6',
          borderRadius: '6px',
          color: '#1f2937',
          textAlign: 'center',
        }}
      >
        {formula}
      </div>

      {/* Coefficient sliders */}
      <CoefficientSliders
        coefficients={edge.coefficients}
        onCoefficientChange={(index, value) =>
          onCoefficientChange(edge.id, index, value)
        }
      />
    </div>
  );
}
