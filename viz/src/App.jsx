/**
 * App.jsx — Top-level layout for the KAN visualization tool.
 *
 * Layout: two-panel side-by-side view.
 *   - Left panel: KanGraph (miniature network with activation curves on edges)
 *   - Right panel: DetailPanel (selected edge's chart, formula, and sliders)
 *
 * This component is the single source of truth for the app state via useKanState.
 * All child components receive state and callbacks as props.
 *
 * Data flow overview:
 *   1. useKanState provides: nodes, edges, selectedEdgeId, hoveredEdgeId
 *   2. KanGraph renders the network and reports clicks/hovers back up
 *   3. DetailPanel shows the selected edge's details and slider controls
 *   4. Slider onChange -> setCoefficient -> state update -> everything re-renders
 *   5. Math module recomputes curves -> Plotly redraws in DetailPanel
 *   6. KanGraph also redraws its mini edge curves with updated coefficients
 */

import React from 'react';
import { useKanState } from './hooks/useKanState.js';
import KanGraph from './components/KanGraph.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import EdgeTooltip from './components/EdgeTooltip.jsx';
import './App.css';

export default function App() {
  const {
    nodes,
    edges,
    selectedEdgeId,
    hoveredEdgeId,
    selectEdge,
    hoverEdge,
    setCoefficient,
    getEdge,
  } = useKanState();

  // Look up the full edge objects for the selected and hovered edges
  const selectedEdge = selectedEdgeId ? getEdge(selectedEdgeId) : null;
  const hoveredEdge = hoveredEdgeId ? getEdge(hoveredEdgeId) : null;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1>KAN Activation Visualizer</h1>
        <p>
          Click an edge to inspect its activation function. Drag the sliders to
          see how each Chebyshev basis polynomial contributes to the total.
        </p>
      </header>

      {/* Main content: graph + detail panel side by side */}
      <div className="app-main">
        {/* Left: network graph */}
        <div className="graph-panel">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <KanGraph
              nodes={nodes}
              edges={edges}
              selectedEdgeId={selectedEdgeId}
              hoveredEdgeId={hoveredEdgeId}
              onSelectEdge={selectEdge}
              onHoverEdge={hoverEdge}
            />
            {/* Tooltip positioned relative to the graph */}
            <EdgeTooltip edge={hoveredEdge} />
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="detail-panel">
          <DetailPanel
            edge={selectedEdge}
            onCoefficientChange={setCoefficient}
          />
        </div>
      </div>
    </div>
  );
}
