"use client";

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';

import { FamilyData, Person } from '@/types/family';

interface GraphViewProps {
  data: FamilyData;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

// --- Custom Node ---

function PersonNode({ data }: { data: { name: string; info: string; years: string } }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 min-w-[160px] max-w-[200px] text-center hover:shadow-md transition-shadow">
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2 !h-2" />
      <p className="font-semibold text-gray-800 text-sm truncate">{data.name}</p>
      {data.info && (
        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2 leading-tight">{data.info}</p>
      )}
      {data.years && (
        <p className="text-gray-400 text-[10px] mt-0.5">{data.years}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-green-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { person: PersonNode };

// --- Data conversion ---

function treeToElements(treeData: FamilyData) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function walk(person: Person) {
    const years = [person.birthYear, person.deathYear].filter(Boolean).join(' - ');
    const infoSnippet = person.info?.length > 30 ? person.info.slice(0, 30) + '…' : (person.info || '');

    nodes.push({
      id: person.id,
      type: 'person',
      data: { name: person.name, info: infoSnippet, years },
      position: { x: 0, y: 0 },
    });

    person.children?.forEach((child) => {
      edges.push({
        id: `e-${person.id}-${child.id}`,
        source: person.id,
        target: child.id,
        type: 'smoothstep',
      });
      walk(child);
    });
  }

  const roots = treeData.generations?.[0]?.people || [];
  roots.forEach(walk);

  return { nodes, edges };
}

// --- Dagre layout ---

function layoutElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// --- Component ---

export default function GraphView({ data }: GraphViewProps) {
  const { nodes, edges } = useMemo(() => {
    const { nodes: rawNodes, edges: rawEdges } = treeToElements(data);
    return layoutElements(rawNodes, rawEdges);
  }, [data]);

  return (
    <div className="w-full" style={{ height: 'calc(100vh - 260px)', minHeight: '500px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls position="bottom-right" />
        <MiniMap
          nodeColor={() => '#93c5fd'}
          maskColor="rgba(0,0,0,0.1)"
          position="bottom-left"
        />
      </ReactFlow>
    </div>
  );
}
