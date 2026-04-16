/**
 * useKanState.js — Central state management for the KAN visualization.
 *
 * This hook owns ALL mutable state for the app:
 *   - Network topology (which nodes exist, which edges connect them)
 *   - Per-edge coefficients (5 Chebyshev coefficients per edge)
 *   - Which edge is currently selected (for the detail panel)
 *   - Which edge is currently hovered (for the tooltip)
 *
 * Data flow:
 *   1. User clicks an edge in KanGraph      -> selectedEdgeId updates
 *   2. User moves a slider in DetailPanel    -> setCoefficient updates the coefficient
 *   3. Components re-render with new state   -> math module recomputes curves
 *   4. Plotly redraws with fresh data
 *
 * The network topology is a simple 2-layer KAN: 2 inputs -> 3 hidden -> 1 output.
 * This gives 2*3 + 3*1 = 9 edges total, each with its own activation function.
 */

import { useState, useCallback, useMemo } from 'react';
import { NUM_BASIS } from '../math/basis.js';

/**
 * Build the default network topology: nodes and edges for a 2 -> 3 -> 1 KAN.
 *
 * Each node has an id, a layer index, and a position index within its layer.
 * Each edge has an id, source node id, target node id, and a coefficients array.
 *
 * @returns {{ nodes: object[], edges: object[] }}
 */
function buildDefaultTopology() {
  const layers = [2, 3, 1]; // 2 input, 3 hidden, 1 output

  const nodes = [];
  let nodeId = 0;
  for (let layer = 0; layer < layers.length; layer++) {
    for (let pos = 0; pos < layers[layer]; pos++) {
      nodes.push({
        id: `n${nodeId}`,
        layer,
        position: pos,
        layerSize: layers[layer],
      });
      nodeId++;
    }
  }

  // Edges connect every node in layer L to every node in layer L+1 (fully connected)
  const edges = [];
  let edgeId = 0;
  for (let layer = 0; layer < layers.length - 1; layer++) {
    const sourceNodes = nodes.filter((n) => n.layer === layer);
    const targetNodes = nodes.filter((n) => n.layer === layer + 1);

    for (const src of sourceNodes) {
      for (const tgt of targetNodes) {
        // Start with small random-ish coefficients so curves aren't all flat
        const coefficients = new Array(NUM_BASIS).fill(0);
        // Give each edge a distinct starting shape for visual interest:
        // set one coefficient to a non-zero value based on edge index
        coefficients[edgeId % NUM_BASIS] = 0.5 + (edgeId % 3) * 0.3;

        edges.push({
          id: `e${edgeId}`,
          sourceId: src.id,
          targetId: tgt.id,
          coefficients,
        });
        edgeId++;
      }
    }
  }

  return { nodes, edges };
}

/**
 * React hook that provides the full KAN visualization state and updater functions.
 *
 * @returns {{
 *   nodes: object[],
 *   edges: object[],
 *   selectedEdgeId: string | null,
 *   hoveredEdgeId: string | null,
 *   selectEdge: (id: string) => void,
 *   hoverEdge: (id: string | null) => void,
 *   setCoefficient: (edgeId: string, index: number, value: number) => void,
 *   getEdge: (edgeId: string) => object | undefined,
 * }}
 */
export function useKanState() {
  const { nodes: defaultNodes, edges: defaultEdges } = useMemo(
    () => buildDefaultTopology(),
    []
  );

  const [nodes] = useState(defaultNodes);
  const [edges, setEdges] = useState(defaultEdges);
  const [selectedEdgeId, setSelectedEdgeId] = useState(defaultEdges[0]?.id ?? null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState(null);

  /**
   * Select an edge to show in the detail panel.
   * @param {string} edgeId
   */
  const selectEdge = useCallback((edgeId) => {
    setSelectedEdgeId(edgeId);
  }, []);

  /**
   * Set the hovered edge (for tooltip display). Pass null to clear.
   * @param {string | null} edgeId
   */
  const hoverEdge = useCallback((edgeId) => {
    setHoveredEdgeId(edgeId);
  }, []);

  /**
   * Update a single coefficient for a specific edge.
   * This is the function that slider onChange handlers call.
   *
   * @param {string} edgeId  - Which edge to update.
   * @param {number} index   - Which coefficient (0-4).
   * @param {number} value   - New coefficient value.
   */
  const setCoefficient = useCallback((edgeId, index, value) => {
    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        if (edge.id !== edgeId) return edge;

        const newCoeffs = [...edge.coefficients];
        newCoeffs[index] = value;
        return { ...edge, coefficients: newCoeffs };
      })
    );
  }, []);

  /**
   * Look up an edge by ID.
   * @param {string} edgeId
   * @returns {object | undefined}
   */
  const getEdge = useCallback(
    (edgeId) => edges.find((e) => e.id === edgeId),
    [edges]
  );

  return {
    nodes,
    edges,
    selectedEdgeId,
    hoveredEdgeId,
    selectEdge,
    hoverEdge,
    setCoefficient,
    getEdge,
  };
}
