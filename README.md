# KAN Activation Visualizer

Interactive tool for visualizing how Chebyshev polynomial basis functions combine
into KAN (Kolmogorov-Arnold Network) edge activations.

## Quick Start

```bash
cd viz
npm install
npm run dev     # http://localhost:5173
npm test        # 24 tests
```

## Data Flow

```
Slider onChange
  |
  v
useKanState.setCoefficient(edgeId, index, value)
  |
  v
React state update (edges array with new coefficients)
  |
  +---> KanGraph re-renders: SVG mini-curves on each edge
  |
  +---> DetailPanel re-renders:
          |
          v
        sampling.js generates x values
          |
          v
        activation.js computes f(x) = sum( c_i * T_i(x) )
          |
          v
        Plotly redraws: faint basis lines + bold activation curve
          |
          v
        Formula display updates: "f(x) = 0.50 T_0 + 1.10 T_1 ..."
```

## File Structure

```
viz/
  src/
    math/
      basis.js        -- Chebyshev polynomial evaluation (T_0 through T_4)
      activation.js   -- Weighted sum of basis functions + formula strings
      sampling.js     -- Generates x/y arrays for Plotly traces
    components/
      KanGraph.jsx    -- SVG network graph, activation curves ON edges
      DetailPanel.jsx -- Plotly chart + formula + sliders for selected edge
      CoefficientSliders.jsx -- 5 range sliders for basis coefficients
      EdgeTooltip.jsx -- Hover tooltip with formula text
    hooks/
      useKanState.js  -- Central state: topology, coefficients, selection
    App.jsx           -- Layout: graph panel + detail panel
  __tests__/
    math.test.js      -- 24 tests covering basis eval, summation, edge cases
```
