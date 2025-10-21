# UI Design Specifications

This document describes the minimalistic user interface design for Galaxy Genesis.

## Design Philosophy

**Minimalist White-on-Dark**
- Maximum focus on the 3D simulation
- White text and controls on transparent/dark backgrounds
- No flashy colors, no distractions
- Scientific/professional aesthetic
- Clean, readable typography

**Non-Intrusive**
- UI overlays should not obstruct the view
- Collapsible panels when not needed
- Semi-transparent backgrounds
- Small, efficient use of screen space

**Functional**
- Every control has a clear purpose
- Immediate visual feedback
- Logical grouping of related controls
- Accessible via keyboard shortcuts

---

## Layout Overview

```
┌─────────────────────────────────────────────────────┐
│  FPS: 60                                   [≡] Menu │ Top bar
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                    3D Canvas                        │
│                 (Full viewport)                     │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ◀────────[====●══════════════]────▶  1000x         │ Bottom bar
│  [Pause]  [Reset]              Particles: 10,000    │
└─────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Stats Display (Top-Left)

**Purpose**: Show performance and simulation metrics

**Position**: Fixed, top-left corner (10px from edges)

**Design**:
```
FPS: 60
Particles: 10,000
Time: 125.3 Myr
```

**Style**:
- Font: monospace, 12px
- Color: white
- Background: rgba(0, 0, 0, 0.3)
- Padding: 8px 12px
- Border-radius: 4px
- Backdrop-filter: blur(4px)

**Implementation**:
```jsx
<div style={{
  position: 'absolute',
  top: 10,
  left: 10,
  background: 'rgba(0, 0, 0, 0.3)',
  color: 'white',
  padding: '8px 12px',
  borderRadius: 4,
  fontFamily: 'monospace',
  fontSize: 12,
  backdropFilter: 'blur(4px)',
  lineHeight: 1.5,
}}>
  <div>FPS: {fps}</div>
  <div>Particles: {count.toLocaleString()}</div>
  <div>Time: {time.toFixed(1)} Myr</div>
</div>
```

---

### 2. Control Panel (Top-Right)

**Purpose**: Main parameter controls

**Position**: Fixed, top-right corner (10px from edges)

**Design**: Collapsible panel with hamburger menu

**Collapsed State**:
```
[≡]
```

**Expanded State**:
```
╔═══════════════════════════════════╗
║  Galaxy Controls              [×] ║
╠═══════════════════════════════════╣
║                                   ║
║  Gravity               [====●==]  ║
║  0.1 ────────────────────── 5.0   ║
║                                   ║
║  Collision Radius      [==●====]  ║
║  0.1 ────────────────────── 2.0   ║
║                                   ║
║  Fusion Threshold      [======●]  ║
║  0.01 ───────────────────── 0.2   ║
║                                   ║
║  ☐ Show Octree                    ║
║  ☐ Show Trails                    ║
║  ☐ Show Velocity Vectors          ║
║                                   ║
╚═══════════════════════════════════╝
```

**Style**:
- Background: rgba(0, 0, 0, 0.5)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Padding: 16px
- Border-radius: 8px
- Min-width: 280px
- Backdrop-filter: blur(8px)

**Slider Style**:
- Track: 2px height, rgba(255, 255, 255, 0.2)
- Thumb: 12px circle, white
- Active thumb: 14px, glow effect
- Show current value above slider

**Checkbox Style**:
- 16px square
- Border: 1px solid white
- Checkmark: white ✓
- Label: white, 14px

**Implementation**:
```jsx
<div style={{
  position: 'absolute',
  top: 10,
  right: 10,
  background: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'white',
  padding: 16,
  borderRadius: 8,
  minWidth: 280,
  backdropFilter: 'blur(8px)',
}}>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Galaxy Controls</h3>
    <button onClick={onClose} style={closeButtonStyle}>×</button>
  </div>

  {/* Sliders */}
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 12, opacity: 0.8 }}>
      Gravity <span style={{ float: 'right' }}>{gravity.toFixed(1)}</span>
    </label>
    <input
      type="range"
      min="0.1"
      max="5"
      step="0.1"
      value={gravity}
      onChange={(e) => setGravity(Number(e.target.value))}
      style={sliderStyle}
    />
  </div>

  {/* Checkboxes */}
  <div style={{ marginTop: 16 }}>
    <label style={{ display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer' }}>
      <input type="checkbox" checked={showOctree} onChange={(e) => setShowOctree(e.target.checked)} />
      <span style={{ marginLeft: 8 }}>Show Octree</span>
    </label>
  </div>
</div>
```

---

### 3. Time Control Bar (Bottom)

**Purpose**: Control simulation time speed

**Position**: Fixed, bottom center (full width)

**Design**:
```
◀────────[====●══════════════]────▶  1000x
[Pause]  [Reset]              Particles: 10,000
```

**Layout**:
- Time slider: 60% width, centered
- Buttons: Left side
- Info: Right side

**Style**:
- Background: rgba(0, 0, 0, 0.4)
- Padding: 12px 20px
- Backdrop-filter: blur(6px)

**Slider**:
- Logarithmic scale: 0.1x to 1,000,000x
- Visual markers at: 1x, 10x, 100x, 1000x, 10000x, 100000x
- Large, prominent (height: 40px)
- Gradient track showing slow → fast

**Buttons**:
- Background: rgba(255, 255, 255, 0.1)
- Border: 1px solid white
- Padding: 8px 16px
- Border-radius: 4px
- Hover: rgba(255, 255, 255, 0.2)
- Active: rgba(255, 255, 255, 0.3)

**Implementation**:
```jsx
<div style={{
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(6px)',
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
}}>
  <button onClick={togglePause} style={buttonStyle}>
    {isRunning ? 'Pause' : 'Play'}
  </button>
  <button onClick={reset} style={buttonStyle}>
    Reset
  </button>

  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
    <span>◀</span>
    <input
      type="range"
      min="0"
      max="6"
      step="0.01"
      value={Math.log10(timeScale)}
      onChange={(e) => setTimeScale(Math.pow(10, Number(e.target.value)))}
      style={{ flex: 1, height: 40 }}
    />
    <span>▶</span>
    <span style={{ minWidth: 80, textAlign: 'right' }}>
      {timeScale.toExponential(0)}
    </span>
  </div>

  <div style={{ fontSize: 12, opacity: 0.8 }}>
    Particles: {particleCount.toLocaleString()}
  </div>
</div>
```

---

## Color Palette

### Text & UI Elements

| Element | Color | Hex |
|---------|-------|-----|
| Primary text | White | #FFFFFF |
| Secondary text | White 80% | rgba(255, 255, 255, 0.8) |
| Disabled text | White 40% | rgba(255, 255, 255, 0.4) |
| Panel background | Black 50% | rgba(0, 0, 0, 0.5) |
| Panel border | White 10% | rgba(255, 255, 255, 0.1) |
| Button background | White 10% | rgba(255, 255, 255, 0.1) |
| Button hover | White 20% | rgba(255, 255, 255, 0.2) |
| Button active | White 30% | rgba(255, 255, 255, 0.3) |
| Slider track | White 20% | rgba(255, 255, 255, 0.2) |
| Slider thumb | White | #FFFFFF |

### Particle Colors (Temperature-Based)

| Type | Temperature | Color |
|------|-------------|-------|
| Cold dust | <100K | Dark brown #4D3D2F |
| Warm dust | 100-1000K | Orange #CC6633 |
| Hot gas | 1000-5000K | Yellow #FFAA33 |
| Proto-star | 5000-10000K | White-yellow #FFEECC |
| Star | >10000K | White #FFFFFF |
| Hot star | >20000K | Blue-white #CCDDFF |
| Black hole disk | Extreme | Purple-white #9966FF |

---

## Typography

### Font Families

**Stats & Monospace Data**:
```css
font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
```

**UI Controls & Labels**:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
```

### Font Sizes

| Element | Size |
|---------|------|
| Stats | 12px |
| Labels | 13px |
| Slider values | 14px |
| Panel titles | 16px |
| Buttons | 14px |

---

## Interactions

### Hover States

**Buttons**:
- Background: rgba(255, 255, 255, 0.2)
- Cursor: pointer
- Transition: 150ms ease

**Sliders**:
- Thumb scale: 1.1x
- Glow: 0 0 8px rgba(255, 255, 255, 0.5)

**Checkboxes**:
- Border: 2px solid white
- Background: rgba(255, 255, 255, 0.1)

### Active States

**Buttons**:
- Background: rgba(255, 255, 255, 0.3)
- Transform: scale(0.98)

**Sliders**:
- Thumb scale: 1.2x
- Show tooltip with exact value

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Pause/Resume |
| R | Reset simulation |
| [ | Decrease time scale |
| ] | Increase time scale |
| T | Toggle trails |
| O | Toggle octree visualization |
| M | Toggle menu |
| F | Toggle fullscreen |
| 1-9 | Jump to time scale presets |

---

## Responsive Behavior

### Mobile (< 768px)

- Hide stats panel
- Simplified control panel (bottom sheet)
- Touch-optimized sliders (larger thumbs)
- Swipe gestures for time control

### Tablet (768px - 1024px)

- Compact control panel
- Abbreviated labels
- Smaller font sizes

### Desktop (> 1024px)

- Full layout as designed
- Larger controls
- More breathing room

---

## Accessibility

### ARIA Labels

```jsx
<input
  type="range"
  aria-label="Gravitational constant"
  aria-valuemin="0.1"
  aria-valuemax="5"
  aria-valuenow={gravity}
  aria-valuetext={`${gravity.toFixed(1)} times standard gravity`}
/>
```

### Keyboard Navigation

- All controls focusable via Tab
- Focus indicators (white outline)
- Escape to close panels

### Screen Reader Support

- Descriptive labels
- Live regions for dynamic updates
- Hidden helper text

---

## Animation & Transitions

### Panel Open/Close

```css
transition: opacity 200ms ease-out, transform 200ms ease-out;
transform: translateY(0);

/* Closed */
opacity: 0;
transform: translateY(-10px);
pointer-events: none;
```

### Slider Changes

```css
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Button Press

```css
transition: transform 100ms ease-out;
/* On click */
transform: scale(0.98);
```

---

## CSS Custom Properties

Define these at root for consistency:

```css
:root {
  /* Colors */
  --ui-white: #ffffff;
  --ui-bg: rgba(0, 0, 0, 0.5);
  --ui-border: rgba(255, 255, 255, 0.1);
  --ui-hover: rgba(255, 255, 255, 0.2);
  --ui-active: rgba(255, 255, 255, 0.3);

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;

  /* Transitions */
  --transition-fast: 100ms ease-out;
  --transition-normal: 150ms ease-out;
  --transition-slow: 200ms ease-out;

  /* Backdrop blur */
  --blur-sm: blur(4px);
  --blur-md: blur(8px);
}
```

---

## Component States

### Loading State

While worker initializes:

```
┌─────────────────────────────────┐
│                                 │
│         Loading...              │
│      Initializing 10,000        │
│         particles               │
│                                 │
│       [Progress bar]            │
│                                 │
└─────────────────────────────────┘
```

### Error State

If worker fails:

```
┌─────────────────────────────────┐
│                                 │
│      ⚠️ Simulation Error        │
│                                 │
│   Could not initialize physics  │
│                                 │
│       [Retry Button]            │
│                                 │
└─────────────────────────────────┘
```

### Empty State

Before initialization:

```
┌─────────────────────────────────┐
│                                 │
│     🌌 Galaxy Genesis           │
│                                 │
│    Click to start simulation    │
│                                 │
└─────────────────────────────────┘
```

---

## Example Complete Implementation

### Full Control Panel Component

```jsx
import { useState } from 'react';

export function ControlPanel({ onConfigChange }) {
  const [isOpen, setIsOpen] = useState(true);
  const [gravity, setGravity] = useState(1.0);
  const [collisionRadius, setCollisionRadius] = useState(0.5);
  const [fusionThreshold, setFusionThreshold] = useState(0.08);
  const [showOctree, setShowOctree] = useState(false);
  const [showTrails, setShowTrails] = useState(false);
  const [showVelocity, setShowVelocity] = useState(false);

  const handleChange = (key, value) => {
    onConfigChange(key, value);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 12px',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 20,
        }}
      >
        ≡
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'white',
      padding: 16,
      borderRadius: 8,
      minWidth: 280,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Galaxy Controls</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: 20,
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <Slider
        label="Gravity"
        min={0.1}
        max={5}
        step={0.1}
        value={gravity}
        onChange={(v) => { setGravity(v); handleChange('gravity', v); }}
      />

      <Slider
        label="Collision Radius"
        min={0.1}
        max={2}
        step={0.1}
        value={collisionRadius}
        onChange={(v) => { setCollisionRadius(v); handleChange('collisionRadius', v); }}
      />

      <Slider
        label="Fusion Threshold"
        min={0.01}
        max={0.2}
        step={0.01}
        value={fusionThreshold}
        onChange={(v) => { setFusionThreshold(v); handleChange('fusionThreshold', v); }}
      />

      <div style={{ marginTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 12 }}>
        <Checkbox
          label="Show Octree"
          checked={showOctree}
          onChange={(v) => { setShowOctree(v); handleChange('showOctree', v); }}
        />
        <Checkbox
          label="Show Trails"
          checked={showTrails}
          onChange={(v) => { setShowTrails(v); handleChange('showTrails', v); }}
        />
        <Checkbox
          label="Show Velocity Vectors"
          checked={showVelocity}
          onChange={(v) => { setShowVelocity(v); handleChange('showVelocity', v); }}
        />
      </div>
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, opacity: 0.8, display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: 4,
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 2,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.5, marginTop: 2 }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer', fontSize: 13 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginRight: 8 }}
      />
      <span>{label}</span>
    </label>
  );
}
```

---

## Final Notes

This UI design prioritizes:
- **Clarity**: Every element has a purpose
- **Performance**: Minimal DOM updates
- **Beauty**: Clean, scientific aesthetic
- **Functionality**: All controls easily accessible

The minimalist white-on-dark theme keeps the focus on the spectacular galaxy simulation while providing all necessary controls in an unobtrusive manner.
