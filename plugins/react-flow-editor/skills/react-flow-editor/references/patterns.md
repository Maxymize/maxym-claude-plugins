# React Flow Editor Patterns

## Table of Contents
1. [Complete Editor Architecture](#complete-editor-architecture)
2. [Custom Node Patterns](#custom-node-patterns)
3. [Custom Edge Patterns](#custom-edge-patterns)
4. [Toolbar Integration](#toolbar-integration)
5. [Properties Panel](#properties-panel)
6. [State Persistence](#state-persistence)
7. [Undo/Redo System](#undoredo-system)
8. [Selection Management](#selection-management)
9. [Connection Mode](#connection-mode)
10. [Export/Import](#exportimport)

---

## Complete Editor Architecture

Standard file structure for a full-featured React Flow editor:

```
components/
├── my-editor/
│   ├── my-editor.tsx              # Main editor with ReactFlowProvider
│   ├── my-editor-toolbar.tsx      # Toolbar with add/delete/connect buttons
│   ├── my-properties-panel.tsx    # Side panel for editing properties
│   ├── nodes/
│   │   ├── custom-node.tsx        # Custom node component
│   │   └── label-node.tsx         # Non-editable label node
│   └── edges/
│       └── custom-edge.tsx        # Custom edge component
```

### Main Editor Template

```tsx
'use client';

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeChange,
  type Connection,
  Panel,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { MyEditorToolbar } from './my-editor-toolbar';
import { MyPropertiesPanel } from './my-properties-panel';
import { CustomNode } from './nodes/custom-node';

const nodeTypes = { custom: CustomNode };

interface MyEditorProps {
  height?: string;
}

// Wrap with provider for useReactFlow access
export function MyEditor(props: MyEditorProps) {
  return (
    <ReactFlowProvider>
      <MyEditorInner {...props} />
    </ReactFlowProvider>
  );
}

function MyEditorInner({ height = '600px' }: MyEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node selection
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (isEditMode) {
      setSelectedNode(node);
      setSelectedEdge(null);
    }
  }, [isEditMode]);

  // Handle edge selection
  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    if (isEditMode) {
      setSelectedEdge(edge);
      setSelectedNode(null);
    }
  }, [isEditMode]);

  // Deselect on pane click
  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Create new connections
  const handleConnect = useCallback((connection: Connection) => {
    if (!isEditMode || !isConnectMode) return;
    setEdges((eds) => addEdge({
      ...connection,
      type: 'smoothstep',
    }, eds));
    setHasUnsavedChanges(true);
  }, [isEditMode, isConnectMode, setEdges]);

  return (
    <div style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        nodesDraggable={isEditMode}
        nodesConnectable={isEditMode && isConnectMode}
        elementsSelectable={isEditMode}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />

        <Panel position="top-center">
          <MyEditorToolbar
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
            isConnectMode={isConnectMode}
            onToggleConnectMode={() => setIsConnectMode(!isConnectMode)}
          />
        </Panel>
      </ReactFlow>

      {isEditMode && (selectedNode || selectedEdge) && (
        <MyPropertiesPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onClose={() => { setSelectedNode(null); setSelectedEdge(null); }}
        />
      )}
    </div>
  );
}
```

---

## Custom Node Patterns

### Basic Custom Node with Multiple Handles

```tsx
import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

interface DeviceNodeData {
  label: string;
  subtitle?: string;
  icon?: string;
  color?: string;
}

type DeviceNodeType = Node<DeviceNodeData>;

export const DeviceNode = memo(({ data, selected }: NodeProps<DeviceNodeType>) => {
  return (
    <div className={`
      px-4 py-3 rounded-lg border-2 min-w-[150px]
      ${selected ? 'ring-2 ring-blue-500' : ''}
      ${data.color || 'bg-white border-gray-300'}
    `}>
      {/* Multi-directional handles */}
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-gray-400" />

      <div className="flex items-center gap-2">
        {data.icon && <span>{data.icon}</span>}
        <div>
          <div className="font-semibold">{data.label}</div>
          {data.subtitle && (
            <div className="text-xs text-gray-500">{data.subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
});

DeviceNode.displayName = 'DeviceNode';
```

### Category-Based Node with Icon Mapping

```tsx
const categoryConfig: Record<string, {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
}> = {
  server: { icon: <ServerIcon />, bgColor: 'bg-blue-100', borderColor: 'border-blue-400' },
  database: { icon: <DatabaseIcon />, bgColor: 'bg-green-100', borderColor: 'border-green-400' },
  client: { icon: <MonitorIcon />, bgColor: 'bg-yellow-100', borderColor: 'border-yellow-400' },
};

export const CategoryNode = memo(({ data, selected }: NodeProps) => {
  const config = categoryConfig[data.category] || categoryConfig.server;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-3`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      <div className="flex items-center gap-2">
        {config.icon}
        <span>{data.label}</span>
      </div>
    </div>
  );
});
```

### Interactive Node with Input

```tsx
export const InputNode = memo(({ data, id }: NodeProps) => {
  const { updateNodeData } = useReactFlow();

  return (
    <div className="bg-white border rounded-lg p-3">
      <Handle type="target" position={Position.Top} />
      <input
        value={data.value}
        onChange={(e) => updateNodeData(id, { value: e.target.value })}
        className="nodrag nopan border rounded px-2 py-1"  // Prevent drag on input
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
```

---

## Custom Edge Patterns

### Styled Edge with Connection Type

```tsx
const connectionStyles: Record<string, React.CSSProperties> = {
  primary: { stroke: '#3b82f6', strokeWidth: 3 },
  secondary: { stroke: '#6b7280', strokeWidth: 2 },
  dashed: { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5,5' },
};

// Apply style when creating edge
const createEdge = (source: string, target: string, type: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  type: 'smoothstep',
  style: connectionStyles[type] || connectionStyles.secondary,
  animated: type === 'primary',
  data: { connectionType: type },
});
```

### Custom Edge with Label

```tsx
import { BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';

export function LabeledEdge({
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, style, markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: '#1a1a2e',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#fff',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
```

---

## Toolbar Integration

```tsx
interface EditorToolbarProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onAddNode: (type: string) => void;
  onDeleteSelected: () => void;
  isConnectMode: boolean;
  onToggleConnectMode: () => void;
  hasSelection: boolean;
  isSaving: boolean;
}

export function EditorToolbar({
  isEditMode, onToggleEditMode,
  onAddNode, onDeleteSelected,
  isConnectMode, onToggleConnectMode,
  hasSelection, isSaving,
}: EditorToolbarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const nodeTypes = [
    { value: 'server', label: 'Server' },
    { value: 'database', label: 'Database' },
    { value: 'client', label: 'Client' },
  ];

  return (
    <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg">
      {/* Edit Mode Toggle */}
      <button
        onClick={onToggleEditMode}
        className={isEditMode ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}
      >
        {isEditMode ? 'View Mode' : 'Edit Mode'}
      </button>

      {isEditMode && (
        <>
          {/* Add Node Dropdown */}
          <div className="relative">
            <button onClick={() => setShowAddMenu(!showAddMenu)}>
              Add Node ▼
            </button>
            {showAddMenu && (
              <div className="absolute top-full mt-1 bg-gray-800 rounded shadow-lg">
                {nodeTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => { onAddNode(type.value); setShowAddMenu(false); }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700"
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connect Mode */}
          <button
            onClick={onToggleConnectMode}
            className={isConnectMode ? 'bg-amber-500' : 'bg-gray-700'}
          >
            {isConnectMode ? 'Connect ON' : 'Connect'}
          </button>

          {/* Delete */}
          <button
            onClick={onDeleteSelected}
            disabled={!hasSelection}
            className={hasSelection ? 'bg-red-500' : 'bg-gray-700 opacity-50'}
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}
```

---

## Properties Panel

```tsx
interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onClose: () => void;
  onUpdateNode: (id: string, data: Partial<NodeData>) => void;
  onUpdateEdge: (id: string, data: Partial<EdgeData>) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
}

export function PropertiesPanel({
  selectedNode, selectedEdge, onClose,
  onUpdateNode, onUpdateEdge, onDeleteNode, onDeleteEdge,
}: PropertiesPanelProps) {
  const [formData, setFormData] = useState({});

  // Sync form with selection
  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode.data);
    } else if (selectedEdge) {
      setFormData(selectedEdge.data || {});
    }
  }, [selectedNode, selectedEdge]);

  const handleSave = () => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, formData);
    } else if (selectedEdge) {
      onUpdateEdge(selectedEdge.id, formData);
    }
  };

  return (
    <div className="absolute right-2 top-2 bottom-2 w-64 bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">
          {selectedNode ? 'Node Properties' : 'Edge Properties'}
        </h3>
        <button onClick={onClose}>✕</button>
      </div>

      {/* Form fields */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400">Label</label>
          <input
            value={formData.label || ''}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1"
          />
        </div>
        {/* Add more fields as needed */}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button onClick={handleSave} className="flex-1 bg-blue-500 rounded py-1">
          Save
        </button>
        <button
          onClick={() => selectedNode ? onDeleteNode(selectedNode.id) : onDeleteEdge(selectedEdge!.id)}
          className="bg-red-500 rounded px-3 py-1"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
```

---

## State Persistence

### Save/Load with Database

```tsx
const SCHEMA_ID = 'my-editor-1.0';

// Load positions on mount
useEffect(() => {
  async function loadPositions() {
    const saved = await getSchemaNodePositions(SCHEMA_ID);
    if (saved && Object.keys(saved).length > 0) {
      setNodes((nds) => nds.map((node) => ({
        ...node,
        position: saved[node.id] || node.position,
      })));
    }
  }
  loadPositions();
}, []);

// Save positions
const savePositions = async () => {
  const positions = nodes.map((n) => ({
    nodeId: n.id,
    x: Math.round(n.position.x),
    y: Math.round(n.position.y),
  }));
  await saveSchemaNodePositionsBatch(SCHEMA_ID, positions);
};
```

### Track Unsaved Changes

```tsx
const handleNodesChange = useCallback((changes: NodeChange[]) => {
  onNodesChange(changes);

  const hasDragEnd = changes.some(
    (c) => c.type === 'position' && !('dragging' in c && c.dragging)
  );

  if (hasDragEnd) {
    setHasUnsavedChanges(true);
  }
}, [onNodesChange]);
```

---

## Undo/Redo System

```tsx
type Snapshot = Array<{ id: string; x: number; y: number }>;

const [history, setHistory] = useState<Snapshot[]>([]);
const [historyIndex, setHistoryIndex] = useState(-1);

const saveToHistory = useCallback(() => {
  const snapshot = nodes.map((n) => ({
    id: n.id,
    x: Math.round(n.position.x),
    y: Math.round(n.position.y),
  }));

  setHistory((prev) => [...prev.slice(0, historyIndex + 1), snapshot].slice(-10));
  setHistoryIndex((prev) => Math.min(prev + 1, 9));
}, [nodes, historyIndex]);

const handleUndo = useCallback(() => {
  if (historyIndex <= 0) return;

  const prevSnapshot = history[historyIndex - 1];
  setNodes((nds) => nds.map((node) => {
    const saved = prevSnapshot.find((s) => s.id === node.id);
    return saved ? { ...node, position: { x: saved.x, y: saved.y } } : node;
  }));

  setHistoryIndex(historyIndex - 1);
}, [history, historyIndex, setNodes]);

const handleRedo = useCallback(() => {
  if (historyIndex >= history.length - 1) return;

  const nextSnapshot = history[historyIndex + 1];
  setNodes((nds) => nds.map((node) => {
    const saved = nextSnapshot.find((s) => s.id === node.id);
    return saved ? { ...node, position: { x: saved.x, y: saved.y } } : node;
  }));

  setHistoryIndex(historyIndex + 1);
}, [history, historyIndex, setNodes]);
```

---

## Selection Management

```tsx
// Add node
const handleAddNode = useCallback((type: string) => {
  const newNode: Node = {
    id: `node-${Date.now()}`,
    type,
    position: { x: 400 + Math.random() * 100, y: 300 + Math.random() * 100 },
    data: { label: `New ${type}` },
  };

  setNodes((nds) => [...nds, newNode]);
  setSelectedNode(newNode);
}, [setNodes]);

// Delete selected
const handleDeleteSelected = useCallback(() => {
  if (selectedNode) {
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) =>
      e.source !== selectedNode.id && e.target !== selectedNode.id
    ));
    setSelectedNode(null);
  } else if (selectedEdge) {
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
    setSelectedEdge(null);
  }
}, [selectedNode, selectedEdge, setNodes, setEdges]);

// Update node data
const handleUpdateNode = useCallback((nodeId: string, data: Partial<NodeData>) => {
  setNodes((nds) => nds.map((n) =>
    n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
  ));
}, [setNodes]);
```

---

## Connection Mode

```tsx
const handleConnect = useCallback((connection: Connection) => {
  if (!isEditMode || !isConnectMode) return;
  if (!connection.source || !connection.target) return;

  // Prevent duplicate connections
  const exists = edges.some(
    (e) => e.source === connection.source && e.target === connection.target
  );
  if (exists) return;

  const newEdge: Edge = {
    id: `edge-${Date.now()}`,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    type: 'smoothstep',
    style: { stroke: '#64748b', strokeWidth: 2 },
    data: { connectionType: 'default' },
  };

  setEdges((eds) => addEdge(newEdge, eds));
}, [isEditMode, isConnectMode, edges, setEdges]);
```

---

## Export/Import

```tsx
const handleExport = useCallback(() => {
  const layout = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type,
      data: e.data,
    })),
  };

  const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `diagram-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}, [nodes, edges]);

const handleImport = useCallback(() => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const text = await file.text();
    const layout = JSON.parse(text);

    if (!layout.version || !layout.nodes) {
      alert('Invalid file format');
      return;
    }

    setNodes(layout.nodes);
    setEdges(layout.edges);
  };
  input.click();
}, [setNodes, setEdges]);
```
