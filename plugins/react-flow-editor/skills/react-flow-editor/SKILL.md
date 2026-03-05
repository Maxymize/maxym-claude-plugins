---
name: react-flow-editor
description: Expert skill for building interactive node-based diagram editors with React Flow (@xyflow/react). Use when creating flow diagrams, network topologies, signal schemas, data pipelines, org charts, or any interactive node-edge visualization. Triggers include "crea schema", "editor diagramma", "topologia", "nodi e connessioni", "React Flow", "diagramma interattivo", "schema segnali", "network diagram", "flow editor", "node editor", "crea editor con nodi", "diagramma con drag and drop".
---

# React Flow Editor Skill

Build complete, production-ready interactive diagram editors with React Flow.

## Workflow

1. **Determine editor type:**
   - **New full editor?** → Follow "Full Editor Setup" below
   - **Add feature to existing?** → Follow "Feature Addition" below
   - **Custom node/edge?** → See [patterns.md](references/patterns.md) custom node/edge sections
   - **API question?** → See [api-reference.md](references/api-reference.md)

2. **Full Editor Setup:**
   - Create main editor component with `ReactFlowProvider` wrapper
   - Define custom node types with `Handle` components
   - Set up state with `useNodesState` and `useEdgesState`
   - Add toolbar for edit mode, add/delete, connect mode
   - Add properties panel for editing selected elements
   - Implement persistence (save/load positions)

3. **Feature Addition:**
   - Read existing editor code first
   - Identify hooks and state already in use
   - Add new functionality following existing patterns

## Quick Start

Minimum viable React Flow editor:

```tsx
'use client';

import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback } from 'react';

// Custom node
function CustomNode({ data, selected }: { data: { label: string }; selected?: boolean }) {
  return (
    <div className={`p-3 border-2 rounded ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

const initialNodes: Node[] = [
  { id: '1', type: 'custom', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', type: 'custom', position: { x: 100, y: 250 }, data: { label: 'Node 2' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
];

function EditorInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((conn: Connection) => {
    setEdges((eds) => addEdge(conn, eds));
  }, [setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}

export function MyEditor() {
  return (
    <ReactFlowProvider>
      <div style={{ height: '600px' }}>
        <EditorInner />
      </div>
    </ReactFlowProvider>
  );
}
```

## Essential Imports

```tsx
import {
  // Core
  ReactFlow,
  ReactFlowProvider,

  // State hooks
  useNodesState,
  useEdgesState,
  useReactFlow,

  // Components
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,

  // Utilities
  addEdge,

  // Types
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type Connection,
  type NodeChange,
  type EdgeChange,
  Position,
  MarkerType,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
```

## Key Patterns

### Edit Mode Toggle
```tsx
<ReactFlow
  nodesDraggable={isEditMode}
  nodesConnectable={isEditMode && isConnectMode}
  elementsSelectable={isEditMode}
/>
```

### Selection Handling
```tsx
const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
  if (isEditMode) {
    setSelectedNode(node);
    setSelectedEdge(null);
  }
}, [isEditMode]);

const handlePaneClick = useCallback(() => {
  setSelectedNode(null);
  setSelectedEdge(null);
}, []);
```

### Add Node
```tsx
const addNode = useCallback((type: string) => {
  const newNode: Node = {
    id: `node-${Date.now()}`,
    type,
    position: { x: 300 + Math.random() * 100, y: 200 + Math.random() * 100 },
    data: { label: `New ${type}` },
  };
  setNodes((nds) => [...nds, newNode]);
}, [setNodes]);
```

### Delete Selected
```tsx
const deleteSelected = useCallback(() => {
  if (selectedNode) {
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) =>
      e.source !== selectedNode.id && e.target !== selectedNode.id
    ));
    setSelectedNode(null);
  }
}, [selectedNode, setNodes, setEdges]);
```

### Update Node Data
```tsx
const updateNode = useCallback((nodeId: string, data: Partial<NodeData>) => {
  setNodes((nds) => nds.map((n) =>
    n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
  ));
}, [setNodes]);
```

## File Structure

For a complete editor:
```
components/my-editor/
├── my-editor.tsx           # Main editor with Provider
├── my-editor-toolbar.tsx   # Toolbar component
├── my-properties-panel.tsx # Properties sidebar
└── nodes/
    └── custom-node.tsx     # Custom node component
```

## Reference Documentation

- **API Reference:** See [api-reference.md](references/api-reference.md) for complete React Flow API
- **Patterns:** See [patterns.md](references/patterns.md) for toolbar, properties panel, undo/redo, export/import patterns

## Research

For features not covered in references, use Context7 MCP to query React Flow documentation:
```
libraryId: /websites/reactflow_dev
query: [your specific question]
```
