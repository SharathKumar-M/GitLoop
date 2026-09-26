import { useEffect, useMemo, useState } from "react";

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";


const API_BASE = "http://localhost:8000";


const layerStyles = {
  frontend: {
    label: "Frontend",
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.32)",
  },
  api: {
    label: "API",
    color: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.32)",
  },
  service: {
    label: "Services",
    color: "#22c55e",
    glow: "rgba(34, 197, 94, 0.32)",
  },
  data: {
    label: "Data",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.32)",
  },
  external: {
    label: "External",
    color: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.32)",
  },
  intelligence: {
    label: "Intelligence",
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.32)",
  },
};


function ArchitectureNode({ data }) {
  const layer = layerStyles[data.layer] || {
    label: "Repository",
    color: "#64748b",
    glow: "rgba(100, 116, 139, 0.25)",
  };

  return (
    <div
      className="relative min-w-[250px] max-w-[290px] overflow-hidden rounded-2xl border bg-[#0b0d13]/95 shadow-2xl backdrop-blur-xl"
      style={{
        borderColor: `${layer.color}45`,
        boxShadow: `0 0 26px ${layer.glow}`,
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
            {data.icon || "◈"}
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

            <p
              className="mt-1 break-words text-sm font-semibold text-white"
              title={data.title}
            >
              {data.title}
            </p>

            <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">
              {data.description}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
          <Metric label="Files" value={data.file_count ?? 0} />
          <Metric
            label="In"
            value={data.incoming_relationships ?? 0}
          />
          <Metric
            label="Out"
            value={data.outgoing_relationships ?? 0}
          />
        </div>

        {data.items?.length > 0 && (
          <div className="mt-4 border-t border-white/5 pt-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
              Files
            </p>

            <div className="mt-2 space-y-1.5">
              {data.items.slice(0, 5).map((item) => (
                <div
                  key={item}
                  className="truncate rounded-md bg-white/[0.025] px-2 py-1 text-[10px] text-slate-500"
                  title={item}
                >
                  {item}
                </div>
              ))}
            </div>
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


function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-2">
      <p className="text-[9px] uppercase tracking-wider text-slate-700">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-300">
        {value}
      </p>
    </div>
  );
}


function formatGeneratedAt(value) {
  if (!value) return "Just now";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}


export default function Architecture({ repository }) {
  const [graph, setGraph] = useState(null);

  const [nodes, setNodes, onNodesChange] =
    useNodesState([]);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeLayer, setActiveLayer] = useState("all");
  const [selectedNode, setSelectedNode] = useState(null);


  async function fetchArchitecture(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const repositoryId =
        repository?.id ?? repository?.repository_id;

      if (!repositoryId) {
        throw new Error(
          "Repository ID is missing."
        );
      }

      const response = await fetch(
        `${API_BASE}/api/github/repositories/${repositoryId}/architecture`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to generate repository architecture."
        );
      }

      setGraph(data);

      /*
       * IMPORTANT:
       * Nodes are stored in React Flow state.
       * This makes their positions mutable, so dragging
       * actually updates the canvas state.
       */
      setNodes(
        (data.nodes || []).map((node) => ({
          ...node,
          draggable: true,
          selectable: true,
        }))
      );

      setEdges(
        (data.edges || []).map((edge) => ({
          ...edge,
          selectable: true,
        }))
      );

      setSelectedNode(null);
    } catch (requestError) {
      console.error(
        "Architecture error:",
        requestError
      );

      setError(
        requestError.message ||
          "Unable to load repository architecture."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  useEffect(() => {
    fetchArchitecture();
  }, [repository?.id, repository?.repository_id]);


  const filteredNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      hidden:
        activeLayer !== "all" &&
        node.data?.layer !== activeLayer,
    }));
  }, [nodes, activeLayer]);


  const visibleNodeIds = useMemo(
    () =>
      new Set(
        filteredNodes
          .filter((node) => !node.hidden)
          .map((node) => node.id)
      ),
    [filteredNodes]
  );


  const filteredEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        hidden:
          !visibleNodeIds.has(edge.source) ||
          !visibleNodeIds.has(edge.target),
      })),
    [edges, visibleNodeIds]
  );


  function handleNodeClick(_, node) {
    setSelectedNode(node);
  }


  function closeDetails() {
    setSelectedNode(null);
  }


  if (loading && !graph) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <ArchitectureHeader
          repository={repository}
          onRefresh={() => fetchArchitecture(true)}
          refreshing={false}
        />

        <LoadingArchitecture />
      </div>
    );
  }


  if (error && !graph) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <ArchitectureHeader
          repository={repository}
          onRefresh={() => fetchArchitecture(true)}
          refreshing={refreshing}
        />

        <div className="rounded-2xl border border-red-400/15 bg-red-500/[0.035] p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-red-300/80">
            Architecture unavailable
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            GitLoop could not build the repository map.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => fetchArchitecture(true)}
            className="mt-5 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }


  const stats = graph?.stats || {};

  return (
    <div className="relative mx-auto max-w-[1600px]">
      <ArchitectureHeader
        repository={repository}
        onRefresh={() => fetchArchitecture(true)}
        refreshing={refreshing}
        generatedAt={graph?.generated_at}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-amber-400/10 bg-amber-400/[0.03] px-4 py-3 text-xs text-amber-200/70">
          Refresh failed, so the last successful architecture snapshot is
          still being displayed.
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <LayerButton
          active={activeLayer === "all"}
          label="All Layers"
          onClick={() => setActiveLayer("all")}
        />

        {Object.entries(layerStyles).map(
          ([key, layer]) => (
            <LayerButton
              key={key}
              active={activeLayer === key}
              label={layer.label}
              color={layer.color}
              onClick={() => setActiveLayer(key)}
            />
          )
        )}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Files"
          value={stats.files ?? 0}
        />

        <StatCard
          label="Modules"
          value={stats.modules ?? 0}
        />

        <StatCard
          label="Relationships"
          value={stats.relationships ?? 0}
        />

        <StatCard
          label="Import edges"
          value={stats.import_relationships ?? 0}
        />

        <StatCard
          label="Analyzed files"
          value={stats.analyzed_files ?? 0}
        />
      </div>

      <div className="relative h-[700px] overflow-hidden rounded-2xl border border-white/10 bg-[#07090f] shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[15%] top-[18%] h-80 w-80 rounded-full bg-purple-600/[0.035] blur-3xl" />
          <div className="absolute right-[18%] top-[12%] h-80 w-80 rounded-full bg-cyan-500/[0.03] blur-3xl" />
          <div className="absolute bottom-[8%] left-[45%] h-72 w-72 rounded-full bg-pink-500/[0.02] blur-3xl" />
        </div>

        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          selectionOnDrag={false}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          preventScrolling={true}
          fitView
          fitViewOptions={{
            padding: 0.22,
          }}
          minZoom={0.3}
          maxZoom={1.7}
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
            nodeColor={(node) =>
              layerStyles[
                node.data?.layer
              ]?.color || "#64748b"
            }
            maskColor="rgba(3, 5, 10, 0.72)"
            className="!border-white/10 !bg-[#0a0c12]"
          />

          <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
              Live system map
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Drag nodes · pan canvas · scroll to zoom
            </p>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] text-slate-500 backdrop-blur-md">
            Drag nodes freely · Use Refresh to update repository data
          </div>
        </ReactFlow>

        {selectedNode && (
          <DetailsPanel
            node={selectedNode}
            onClose={closeDetails}
          />
        )}
      </div>

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
          {graph?.repository?.full_name ||
            repository?.full_name ||
            repository?.name ||
            "Repository"}
          {" · "}
          {graph?.repository?.branch || "current branch"}
          {" · "}
          {formatGeneratedAt(graph?.generated_at)}
        </p>
      </div>
    </div>
  );
}


function ArchitectureHeader({
  repository,
  onRefresh,
  refreshing,
  generatedAt,
}) {
  return (
    <div className="mb-5">
      <p className="text-sm text-purple-400">
        Repository intelligence
      </p>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Architecture
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Explore the actual repository as a connected system of modules,
            imports, services, data stores, AI integrations, and external systems.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.04] px-3.5 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs text-slate-400">
              Live repository data
            </span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2 text-xs text-slate-300 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {generatedAt && (
        <p className="mt-2 text-[11px] text-slate-700">
          Last generated {formatGeneratedAt(generatedAt)}
          {repository?.full_name
            ? ` · ${repository.full_name}`
            : ""}
        </p>
      )}
    </div>
  );
}


function LayerButton({
  active,
  label,
  color,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "text-white"
          : "text-slate-500 hover:text-white"
      }`}
      style={{
        borderColor:
          active && color
            ? `${color}55`
            : active
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,255,255,0.08)",
        background:
          active && color
            ? `${color}12`
            : active
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.02)",
      }}
    >
      {color && (
        <span
          className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
          style={{
            background: color,
          }}
        />
      )}

      {label}
    </button>
  );
}


function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-700">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}


function LoadingArchitecture() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#07090f] p-10">
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />
          <p className="mt-4 text-sm text-slate-400">
            Building architecture from the repository...
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Reading the current GitHub branch and resolving imports.
          </p>
        </div>
      </div>
    </div>
  );
}


function DetailsPanel({ node, onClose }) {
  const data = node.data || {};
  const layer =
    layerStyles[data.layer] || layerStyles.service;

  return (
    <div className="absolute right-4 top-4 z-20 w-[340px] max-h-[calc(100%-32px)] overflow-auto rounded-2xl border border-white/10 bg-[#090b11]/96 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{
              color: layer.color,
            }}
          >
            {layer.label}
          </p>

          <h2 className="mt-2 break-words text-lg font-semibold text-white">
            {data.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-lg text-slate-600 transition hover:text-white"
          aria-label="Close details"
        >
          ×
        </button>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {data.description}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric
          label="Files"
          value={data.file_count ?? 0}
        />

        <Metric
          label="Incoming"
          value={
            data.incoming_relationships ?? 0
          }
        />

        <Metric
          label="Outgoing"
          value={
            data.outgoing_relationships ?? 0
          }
        />
      </div>

      {data.languages?.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
            Languages
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {data.languages.map((language) => (
              <span
                key={language}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400"
              >
                {language}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.items?.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
            Repository files
          </p>

          <div className="mt-2 space-y-1.5">
            {data.items.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2 text-[11px] leading-5 text-slate-400"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-white/5 pt-4">
        <p className="text-xs leading-5 text-slate-600">
          This node was generated from the repository file tree and
          source/configuration content. No placeholder architecture data is
          used.
        </p>
      </div>
    </div>
  );
}
