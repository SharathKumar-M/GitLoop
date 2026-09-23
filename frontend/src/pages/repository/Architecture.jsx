import { useState } from "react";

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";


const layerStyles = {
  frontend: {
    label: "Frontend",
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.35)",
  },
  api: {
    label: "API",
    color: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.35)",
  },
  service: {
    label: "Services",
    color: "#22c55e",
    glow: "rgba(34, 197, 94, 0.35)",
  },
  data: {
    label: "Data",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.35)",
  },
  external: {
    label: "External",
    color: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.35)",
  },
  intelligence: {
    label: "Intelligence",
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.35)",
  },
};


function ArchitectureNode({ data }) {
  const layer = layerStyles[data.layer];

  return (
    <div
      className="relative min-w-[210px] overflow-hidden rounded-2xl border bg-[#0b0d13]/95 shadow-2xl backdrop-blur-xl"
      style={{
        borderColor: `${layer.color}45`,
        boxShadow: `0 0 28px ${layer.glow}`,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-[#09090d]"
        style={{
          background: layer.color,
        }}
      />

      <div
        className="h-1 w-full"
        style={{
          background: layer.color,
        }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{
              color: layer.color,
              background: `${layer.color}15`,
              border: `1px solid ${layer.color}30`,
            }}
          >
            {data.icon}
          </div>

          <div className="min-w-0">
            <p
              className="text-[10px] font-medium uppercase tracking-[0.18em]"
              style={{
                color: layer.color,
              }}
            >
              {layer.label}
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-white">
              {data.title}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {data.description}
            </p>
          </div>
        </div>

        {data.items?.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-white/5 pt-3">
            {data.items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-xs text-slate-500"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: layer.color,
                  }}
                />

                <span className="truncate">
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-[#09090d]"
        style={{
          background: layer.color,
        }}
      />
    </div>
  );
}


const nodeTypes = {
  architecture: ArchitectureNode,
};


const initialNodes = [
  {
    id: "frontend",
    type: "architecture",
    position: { x: 40, y: 230 },
    data: {
      layer: "frontend",
      icon: "◈",
      title: "Frontend",
      description: "Developer-facing application",
      items: [
        "Pages",
        "Components",
        "Repository Workspace",
      ],
    },
  },

  {
    id: "api",
    type: "architecture",
    position: { x: 350, y: 230 },
    data: {
      layer: "api",
      icon: "⇄",
      title: "API Layer",
      description: "Application routes and requests",
      items: [
        "Repository API",
        "Authentication",
        "Codebase API",
      ],
    },
  },

  {
    id: "services",
    type: "architecture",
    position: { x: 690, y: 120 },
    data: {
      layer: "service",
      icon: "⚙",
      title: "Application Services",
      description: "Core backend operations",
      items: [
        "GitHub Service",
        "Repository Indexer",
        "Authentication Service",
      ],
    },
  },

  {
    id: "database",
    type: "architecture",
    position: { x: 1050, y: 300 },
    data: {
      layer: "data",
      icon: "◉",
      title: "PostgreSQL",
      description: "Persistent application data",
      items: [
        "Users",
        "Repositories",
        "Indexed Files",
        "Sessions",
      ],
    },
  },

  {
    id: "github",
    type: "architecture",
    position: { x: 690, y: 450 },
    data: {
      layer: "external",
      icon: "◎",
      title: "GitHub",
      description: "Repository source and metadata",
      items: [
        "Repositories",
        "Branches",
        "Commits",
        "Pull Requests",
      ],
    },
  },

  {
    id: "intelligence",
    type: "architecture",
    position: { x: 1050, y: 80 },
    data: {
      layer: "intelligence",
      icon: "✦",
      title: "AI Intelligence",
      description: "Repository understanding layer",
      items: [
        "Code Analysis",
        "Semantic Search",
        "RAG",
        "AI Chat",
      ],
    },
  },

  {
    id: "vector",
    type: "architecture",
    position: { x: 1410, y: 120 },
    data: {
      layer: "intelligence",
      icon: "⌁",
      title: "Vector Search",
      description: "Semantic repository knowledge",
      items: [
        "Embeddings",
        "Code Chunks",
        "Similarity Search",
      ],
    },
  },
];


const initialEdges = [
  {
    id: "frontend-api",
    source: "frontend",
    target: "api",
    animated: true,
    style: {
      stroke: "#a855f7",
      strokeWidth: 2,
      strokeDasharray: "7 5",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#a855f7",
    },
  },

  {
    id: "api-services",
    source: "api",
    target: "services",
    animated: true,
    style: {
      stroke: "#38bdf8",
      strokeWidth: 2,
      strokeDasharray: "7 5",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#38bdf8",
    },
  },

  {
    id: "services-database",
    source: "services",
    target: "database",
    animated: true,
    style: {
      stroke: "#22c55e",
      strokeWidth: 2,
      strokeDasharray: "7 5",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#22c55e",
    },
  },

  {
    id: "services-github",
    source: "services",
    target: "github",
    animated: true,
    style: {
      stroke: "#f43f5e",
      strokeWidth: 2,
      strokeDasharray: "7 5",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#f43f5e",
    },
  },

  {
    id: "services-intelligence",
    source: "services",
    target: "intelligence",
    animated: true,
    style: {
      stroke: "#06b6d4",
      strokeWidth: 2,
      strokeDasharray: "7 5",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#06b6d4",
    },
  },

  {
    id: "intelligence-vector",
    source: "intelligence",
    target: "vector",
    animated: true,
    style: {
      stroke: "#06b6d4",
      strokeWidth: 2,
      strokeDasharray: "7 5",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#06b6d4",
    },
  },

  {
    id: "github-intelligence",
    source: "github",
    target: "intelligence",
    animated: true,
    style: {
      stroke: "#f43f5e",
      strokeWidth: 1.5,
      strokeDasharray: "5 6",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#f43f5e",
    },
  },
];


export default function Architecture({ repository }) {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  const [selectedNode, setSelectedNode] =
    useState(null);

  const [activeLayer, setActiveLayer] =
    useState("all");


  const filteredNodes = nodes.map((node) => {
    if (activeLayer === "all") {
      return node;
    }

    return {
      ...node,
      hidden:
        node.data.layer !== activeLayer,
    };
  });


  const filteredNodeIds = new Set(
    filteredNodes
      .filter((node) => !node.hidden)
      .map((node) => node.id)
  );


  const filteredEdges = edges.map((edge) => ({
    ...edge,
    hidden:
      !filteredNodeIds.has(edge.source) ||
      !filteredNodeIds.has(edge.target),
  }));


  function handleNodeClick(_, node) {
    setSelectedNode(node);
  }


  function closeDetails() {
    setSelectedNode(null);
  }


  return (
    <div className="relative mx-auto max-w-[1600px]">

      {/* Header */}
      <div className="mb-5">
        <p className="text-sm text-purple-400">
          Repository intelligence
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Architecture
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Explore the repository as a living system of connected components.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs text-slate-400">
              Architecture Canvas
            </span>
          </div>
        </div>
      </div>


      {/* Layer Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveLayer("all")}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            activeLayer === "all"
              ? "border-white/20 bg-white/[0.08] text-white"
              : "border-white/10 bg-white/[0.02] text-slate-500 hover:text-white"
          }`}
        >
          All Layers
        </button>

        {Object.entries(layerStyles).map(
          ([key, layer]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveLayer(key)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                activeLayer === key
                  ? "text-white"
                  : "text-slate-500 hover:text-white"
              }`}
              style={{
                borderColor:
                  activeLayer === key
                    ? `${layer.color}55`
                    : "rgba(255,255,255,0.08)",
                background:
                  activeLayer === key
                    ? `${layer.color}12`
                    : "rgba(255,255,255,0.02)",
              }}
            >
              <span
                className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: layer.color,
                }}
              />

              {layer.label}
            </button>
          )
        )}
      </div>


      {/* Canvas */}
      <div className="relative h-[700px] overflow-hidden rounded-2xl border border-white/10 bg-[#07090f] shadow-2xl shadow-black/30">

        {/* Canvas Glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[18%] top-[20%] h-80 w-80 rounded-full bg-purple-600/[0.04] blur-3xl" />
          <div className="absolute right-[18%] top-[15%] h-80 w-80 rounded-full bg-cyan-500/[0.035] blur-3xl" />
          <div className="absolute bottom-[10%] left-[45%] h-72 w-72 rounded-full bg-pink-500/[0.025] blur-3xl" />
        </div>


        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{
            padding: 0.2,
          }}
          minZoom={0.35}
          maxZoom={1.8}
          attributionPosition="bottom-left"
          proOptions={{
            hideAttribution: true,
          }}
        >
          <Background
            gap={28}
            size={1}
            color="#1f2937"
          />

          <Controls
            position="bottom-right"
            showInteractive={false}
          />

          <MiniMap
            position="bottom-left"
            pannable
            zoomable
            nodeColor={(node) => {
              return (
                layerStyles[node.data?.layer]?.color ||
                "#64748b"
              );
            }}
            maskColor="rgba(3, 5, 10, 0.72)"
            className="!border-white/10 !bg-[#0a0c12]"
          />

          {/* Canvas badge */}
          <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
              System Map
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Drag nodes · Scroll to zoom · Click to inspect
            </p>
          </div>

        </ReactFlow>


        {/* Details Panel */}
        {selectedNode && (
          <div className="absolute right-4 top-4 z-20 w-[310px] rounded-2xl border border-white/10 bg-[#090b11]/95 p-5 shadow-2xl backdrop-blur-xl">

            <div className="flex items-start justify-between gap-4">

              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{
                    color:
                      layerStyles[
                        selectedNode.data.layer
                      ]?.color,
                  }}
                >
                  {
                    layerStyles[
                      selectedNode.data.layer
                    ]?.label
                  }
                </p>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  {selectedNode.data.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="text-lg text-slate-600 transition hover:text-white"
              >
                ×
              </button>

            </div>


            <p className="mt-3 text-sm leading-6 text-slate-400">
              {selectedNode.data.description}
            </p>


            {selectedNode.data.items?.length > 0 && (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Components
                </p>

                <div className="mt-3 space-y-2">
                  {selectedNode.data.items.map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background:
                              layerStyles[
                                selectedNode.data.layer
                              ]?.color,
                          }}
                        />

                        <span className="text-xs text-slate-400">
                          {item}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}


            <div className="mt-5 border-t border-white/5 pt-4">
              <p className="text-xs leading-5 text-slate-600">
                Select a component to investigate its
                relationships and repository files.
              </p>
            </div>

          </div>
        )}

      </div>


      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {Object.entries(layerStyles).map(
            ([key, layer]) => (
              <div
                key={key}
                className="flex items-center gap-2"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: layer.color,
                    boxShadow: `0 0 10px ${layer.color}`,
                  }}
                />

                <span className="text-xs text-slate-600">
                  {layer.label}
                </span>
              </div>
            )
          )}
        </div>

        <p className="text-xs text-slate-700">
          {repository?.name || "Repository"} · Interactive architecture
        </p>
      </div>

    </div>
  );
}