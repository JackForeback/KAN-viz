/**
 * KanGraph.jsx — Miniature KAN network visualization.
 *
 * Renders the network as an SVG with:
 *   - Circles for nodes (arranged by layer)
 *   - Paths for edges connecting nodes across layers
 *   - Small activation function curves drawn ALONG each edge (KAN-style,
 *     not inside nodes like an MLP)
 *
 * Interactions:
 *   - Click an edge to select it (shown in the detail panel)
 *   - Hover an edge to see its formula tooltip
 *
 * The SVG layout computes node positions based on layer index (x) and
 * position within the layer (y), then draws edges between connected nodes.
 */

import React, { useMemo } from 'react';
import { computeActivation } from '../math/activation.js';

/** SVG dimensions */
const SVG_WIDTH = 500;
const SVG_HEIGHT = 400;
const NODE_RADIUS = 18;
const EDGE_CURVE_SAMPLES = 40;
const EDGE_CURVE_AMPLITUDE = 20; // How tall the mini curve is on each edge

/**
 * Compute pixel positions for each node based on its layer and position.
 * Layers are spread horizontally, nodes within a layer spread vertically.
 *
 * @param {object[]} nodes - Array of node objects with { id, layer, position, layerSize }.
 * @returns {Map<string, {x: number, y: number}>} Map from node id to pixel coords.
 */
function computeNodePositions(nodes) {
  const positions = new Map();

  // Find the number of layers
  const maxLayer = Math.max(...nodes.map((n) => n.layer));
  const horizontalPadding = 80;
  const verticalPadding = 60;

  for (const node of nodes) {
    // x: spread layers evenly across the width
    const x =
      horizontalPadding +
      (node.layer / Math.max(maxLayer, 1)) *
        (SVG_WIDTH - 2 * horizontalPadding);

    // y: center nodes in their layer, spread evenly
    const totalHeight = SVG_HEIGHT - 2 * verticalPadding;
    const spacing =
      node.layerSize > 1 ? totalHeight / (node.layerSize - 1) : 0;
    const layerTop =
      node.layerSize > 1
        ? verticalPadding
        : SVG_HEIGHT / 2; // single node: center it
    const y = layerTop + node.position * spacing;

    positions.set(node.id, { x, y });
  }

  return positions;
}

/**
 * Generate a mini activation curve as an SVG path string.
 *
 * The curve is drawn along the edge between two nodes. We sample the
 * activation function at several points and offset perpendicular to
 * the edge direction, creating a small "wave" that sits on the edge.
 *
 * @param {{x: number, y: number}} from  - Start node position.
 * @param {{x: number, y: number}} to    - End node position.
 * @param {number[]} coefficients         - Edge coefficients [c0..c4].
 * @returns {string} SVG path d attribute.
 */
function buildEdgeCurvePath(from, to, coefficients) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return '';

  // Unit vector along the edge
  const ux = dx / length;
  const uy = dy / length;

  // Perpendicular unit vector (for the curve offset)
  const px = -uy;
  const py = ux;

  // Sample the activation function and build path points
  // We skip the first/last 15% to leave room near the nodes
  const startFrac = 0.15;
  const endFrac = 0.85;
  const points = [];

  for (let i = 0; i <= EDGE_CURVE_SAMPLES; i++) {
    const t = startFrac + (i / EDGE_CURVE_SAMPLES) * (endFrac - startFrac);

    // Position along the edge
    const baseX = from.x + t * dx;
    const baseY = from.y + t * dy;

    // x input to activation: map t from [startFrac, endFrac] to [-1, 1]
    const xInput = ((t - startFrac) / (endFrac - startFrac)) * 2 - 1;
    const activationValue = computeActivation(coefficients, xInput);

    // Clamp the activation to avoid curves flying off the edge
    const clampedValue = Math.max(-3, Math.min(3, activationValue));

    // Offset perpendicular to the edge based on the activation value
    const offsetX = baseX + px * clampedValue * EDGE_CURVE_AMPLITUDE;
    const offsetY = baseY + py * clampedValue * EDGE_CURVE_AMPLITUDE;

    points.push({ x: offsetX, y: offsetY });
  }

  // Build SVG path: M start L ... L end
  const pathParts = points.map((p, i) =>
    i === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  );

  return pathParts.join(' ');
}

/**
 * KanGraph component.
 *
 * @param {object} props
 * @param {object[]} props.nodes        - Network nodes.
 * @param {object[]} props.edges        - Network edges with coefficients.
 * @param {string|null} props.selectedEdgeId - Currently selected edge.
 * @param {string|null} props.hoveredEdgeId  - Currently hovered edge.
 * @param {function} props.onSelectEdge - Called when an edge is clicked.
 * @param {function} props.onHoverEdge  - Called when an edge is hovered (null to clear).
 */
export default function KanGraph({
  nodes,
  edges,
  selectedEdgeId,
  hoveredEdgeId,
  onSelectEdge,
  onHoverEdge,
}) {
  // Compute node positions once (nodes don't change)
  const nodePositions = useMemo(() => computeNodePositions(nodes), [nodes]);

  return (
    <svg
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      style={{ border: '1px solid #ddd', borderRadius: '8px', background: '#fafafa' }}
    >
      {/* Layer labels */}
      <text x={80} y={25} textAnchor="middle" fontSize="12" fill="#888">
        Input
      </text>
      <text x={SVG_WIDTH / 2} y={25} textAnchor="middle" fontSize="12" fill="#888">
        Hidden
      </text>
      <text x={SVG_WIDTH - 80} y={25} textAnchor="middle" fontSize="12" fill="#888">
        Output
      </text>

      {/* Edges: straight line background + activation curve overlay */}
      {edges.map((edge) => {
        const from = nodePositions.get(edge.sourceId);
        const to = nodePositions.get(edge.targetId);
        if (!from || !to) return null;

        const isSelected = edge.id === selectedEdgeId;
        const isHovered = edge.id === hoveredEdgeId;
        const curvePath = buildEdgeCurvePath(from, to, edge.coefficients);

        return (
          <g key={edge.id}>
            {/* Invisible wide hitbox for easier clicking/hovering */}
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="transparent"
              strokeWidth={20}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectEdge(edge.id)}
              onMouseEnter={() => onHoverEdge(edge.id)}
              onMouseLeave={() => onHoverEdge(null)}
            />

            {/* Thin straight line showing the edge connection */}
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isSelected ? '#4a90d9' : '#ccc'}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={isSelected ? 'none' : '4,4'}
              pointerEvents="none"
            />

            {/* Activation curve drawn ON the edge */}
            {curvePath && (
              <path
                d={curvePath}
                fill="none"
                stroke={
                  isSelected
                    ? '#2563eb'
                    : isHovered
                    ? '#f59e0b'
                    : '#6b7280'
                }
                strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                opacity={isSelected ? 1 : isHovered ? 0.9 : 0.5}
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}

      {/* Nodes drawn on top of edges */}
      {nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;

        return (
          <g key={node.id}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={NODE_RADIUS}
              fill="white"
              stroke="#4a90d9"
              strokeWidth={2}
            />
            <text
              x={pos.x}
              y={pos.y + 5}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#4a90d9"
            >
              {node.layer === 0
                ? `x${node.position + 1}`
                : node.layer === 2
                ? 'y'
                : `h${node.position + 1}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
