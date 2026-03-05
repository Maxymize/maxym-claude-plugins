# React Flow API Reference

## Core Components

### ReactFlow
Main component that renders the flow diagram.

```typescript
import { ReactFlow, ReactFlowProvider } from '@xyflow/react';

<ReactFlowProvider>
  <ReactFlow
    nodes={nodes}
    edges={edges}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    fitView
    minZoom={0.3}
    maxZoom={2}
    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
    proOptions={{ hideAttribution: true }}
    nodesDraggable={true}
    nodesConnectable={true}
    elementsSelectable={true}
    onNodeClick={(event, node) => {}}
    onEdgeClick={(event, edge) => {}}
    onPaneClick={() => {}}
  >
    <Background />
    <Controls />
    <MiniMap />
    <Panel position="top-left">Custom UI</Panel>
  </ReactFlow>
</ReactFlowProvider>
```

**Key Props:**
- `nodes` / `edges`: Array of nodes/edges
- `onNodesChange` / `onEdgesChange`: Change handlers
- `onConnect`: New connection handler
- `nodeTypes` / `edgeTypes`: Custom component types
- `fitView`: Auto-fit viewport on mount
- `nodesDraggable`: Enable/disable dragging
- `nodesConnectable`: Enable/disable connections
- `elementsSelectable`: Enable/disable selection

### Background
Renders a pattern behind the flow.

```tsx
<Background
  color="#aaa"
  gap={20}
  size={1}
  variant="dots" // 'dots' | 'lines' | 'cross'
/>
```

### Controls
Zoom and fit controls panel.

```tsx
<Controls
  showZoom={true}
  showFitView={true}
  showInteractive={true}
  position="bottom-left"
/>
```

### MiniMap
Miniature overview of the flow.

```tsx
<MiniMap
  nodeColor={(node) => '#eee'}
  maskColor="rgba(0,0,0,0.5)"
  zoomable
  pannable
/>
```

### Panel
Positioned container for custom UI.

```tsx
<Panel position="top-left" className="custom-panel">
  <button>Custom Button</button>
</Panel>
```

**Positions:** `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`

---

## Node Types

### Node Structure

```typescript
interface Node<T = any> {
  id: string;                    // Unique identifier
  type?: string;                 // Custom node type
  position: { x: number; y: number };
  data: T;                       // Custom data
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  hidden?: boolean;
  selected?: boolean;
  style?: CSSProperties;
  className?: string;
  sourcePosition?: Position;     // Default handle position
  targetPosition?: Position;
}
```

### Custom Node Component

```tsx
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

interface MyNodeData {
  label: string;
  value: number;
}

type MyNodeType = Node<MyNodeData>;

function MyCustomNode({ data, selected, id }: NodeProps<MyNodeType>) {
  return (
    <div className={`node ${selected ? 'selected' : ''}`}>
      {/* Target handles (inputs) */}
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left-input" />

      {/* Node content */}
      <div className="label">{data.label}</div>
      <div className="value">{data.value}</div>

      {/* Source handles (outputs) */}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right-output" />
    </div>
  );
}

// Register custom node types
const nodeTypes = {
  custom: MyCustomNode,
};
```

### Handle Component

```tsx
<Handle
  type="source" | "target"
  position={Position.Top | Position.Right | Position.Bottom | Position.Left}
  id="optional-id"              // Required for multiple handles
  isConnectable={true}
  isConnectableStart={true}
  isConnectableEnd={true}
  isValidConnection={(connection) => true}
  onConnect={(params) => {}}
  style={{ background: '#555' }}
/>
```

---

## Edge Types

### Edge Structure

```typescript
interface Edge<T = any> {
  id: string;
  source: string;               // Source node ID
  target: string;               // Target node ID
  sourceHandle?: string;        // Source handle ID
  targetHandle?: string;        // Target handle ID
  type?: string;                // Edge type
  data?: T;                     // Custom data
  label?: string | ReactNode;
  labelStyle?: CSSProperties;
  labelBgStyle?: CSSProperties;
  style?: CSSProperties;
  animated?: boolean;
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
  selected?: boolean;
  hidden?: boolean;
}
```

### Built-in Edge Types
- `default`: Bezier curve
- `straight`: Straight line
- `step`: Right-angle steps
- `smoothstep`: Smooth right-angle steps

### Edge Markers

```typescript
import { MarkerType } from '@xyflow/react';

const edge = {
  markerEnd: {
    type: MarkerType.Arrow,     // or MarkerType.ArrowClosed
    width: 20,
    height: 20,
    color: '#333',
  },
};
```

### Custom Edge Component

```tsx
import {
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer
} from '@xyflow/react';

function CustomEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

---

## Hooks

### useNodesState / useEdgesState

```typescript
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
```

### useReactFlow

```typescript
const {
  // Getters
  getNodes,
  getEdges,
  getNode,
  getEdge,
  getViewport,

  // Setters
  setNodes,
  setEdges,
  setViewport,

  // Mutations
  addNodes,
  addEdges,
  deleteElements,
  updateNode,
  updateNodeData,

  // Viewport
  fitView,
  zoomIn,
  zoomOut,
  setCenter,

  // Utilities
  screenToFlowPosition,
  flowToScreenPosition,
  getIntersectingNodes,
  isNodeIntersecting,
} = useReactFlow();
```

### useNodes / useEdges
Reactive hooks that re-render on changes:

```typescript
const nodes = useNodes();  // Re-renders when nodes change
const edges = useEdges();  // Re-renders when edges change
```

### useOnSelectionChange

```typescript
useOnSelectionChange({
  onChange: ({ nodes, edges }) => {
    console.log('Selected nodes:', nodes);
    console.log('Selected edges:', edges);
  },
});
```

### useOnViewportChange

```typescript
useOnViewportChange({
  onStart: (viewport) => console.log('Viewport change started'),
  onChange: (viewport) => console.log('Viewport changed:', viewport),
  onEnd: (viewport) => console.log('Viewport change ended'),
});
```

---

## Event Callbacks

### Node Events
```typescript
onNodeClick?: (event: React.MouseEvent, node: Node) => void;
onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
onNodeDragStart?: (event: React.MouseEvent, node: Node) => void;
onNodeDrag?: (event: React.MouseEvent, node: Node) => void;
onNodeDragStop?: (event: React.MouseEvent, node: Node) => void;
onNodeMouseEnter?: (event: React.MouseEvent, node: Node) => void;
onNodeMouseLeave?: (event: React.MouseEvent, node: Node) => void;
onNodeMouseMove?: (event: React.MouseEvent, node: Node) => void;
onNodeContextMenu?: (event: React.MouseEvent, node: Node) => void;
```

### Edge Events
```typescript
onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
onEdgeDoubleClick?: (event: React.MouseEvent, edge: Edge) => void;
onEdgeMouseEnter?: (event: React.MouseEvent, edge: Edge) => void;
onEdgeMouseLeave?: (event: React.MouseEvent, edge: Edge) => void;
onEdgeMouseMove?: (event: React.MouseEvent, edge: Edge) => void;
onEdgeContextMenu?: (event: React.MouseEvent, edge: Edge) => void;
onEdgeUpdate?: (oldEdge: Edge, newConnection: Connection) => void;
```

### Connection Events
```typescript
onConnect?: (connection: Connection) => void;
onConnectStart?: (event: React.MouseEvent, params: OnConnectStartParams) => void;
onConnectEnd?: (event: MouseEvent) => void;
isValidConnection?: (connection: Connection) => boolean;
```

### Selection Events
```typescript
onSelectionChange?: (params: { nodes: Node[]; edges: Edge[] }) => void;
onSelectionDragStart?: (event: React.MouseEvent, nodes: Node[]) => void;
onSelectionDrag?: (event: React.MouseEvent, nodes: Node[]) => void;
onSelectionDragStop?: (event: React.MouseEvent, nodes: Node[]) => void;
```

### Pane Events
```typescript
onPaneClick?: (event: React.MouseEvent) => void;
onPaneContextMenu?: (event: React.MouseEvent) => void;
onPaneScroll?: (event: React.WheelEvent) => void;
onPaneMouseMove?: (event: React.MouseEvent) => void;
```

---

## Utilities

### addEdge
```typescript
import { addEdge } from '@xyflow/react';

const onConnect = useCallback(
  (connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  },
  [setEdges]
);
```

### getOutgoers / getIncomers
```typescript
import { getOutgoers, getIncomers } from '@xyflow/react';

const outgoers = getOutgoers(node, nodes, edges);
const incomers = getIncomers(node, nodes, edges);
```

### getConnectedEdges
```typescript
import { getConnectedEdges } from '@xyflow/react';

const connectedEdges = getConnectedEdges([node], edges);
```

### Path Functions
```typescript
import {
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  getSimpleBezierPath,
} from '@xyflow/react';

const [path, labelX, labelY] = getSmoothStepPath({
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition,
  targetPosition,
  borderRadius: 10,
});
```

---

## TypeScript Types

```typescript
import type {
  Node,
  Edge,
  NodeProps,
  EdgeProps,
  Connection,
  NodeChange,
  EdgeChange,
  Viewport,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Position,
  MarkerType,
} from '@xyflow/react';
```

---

## CSS Classes

Add to elements for special behavior:
- `.nodrag` - Prevent dragging on element
- `.nopan` - Prevent panning when interacting
- `.nowheel` - Prevent zoom on wheel
- `.react-flow__node-default` - Default node styling
- `.react-flow__edge-path` - Edge path styling
- `.react-flow__handle` - Handle styling

---

## Best Practices

1. **Wrap with ReactFlowProvider** when using `useReactFlow` hook
2. **Use `useCallback`** for event handlers to prevent re-renders
3. **Memoize custom nodes** with `React.memo()`
4. **Add `nodrag` class** to interactive elements inside nodes
5. **Use `id` prop** on handles when having multiple handles
6. **Keep node data serializable** for save/load functionality
