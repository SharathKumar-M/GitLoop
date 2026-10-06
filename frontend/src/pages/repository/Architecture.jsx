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


const API_BASE = import.meta.env.VITE_API_URL;


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
  const [inspectorTab, setInspectorTab] = useState("overview");
  const [focusNodeId, setFocusNodeId] = useState(null);


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
      setFocusNodeId(null);
      setInspectorTab("overview");
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


  const connectedNodeIds = useMemo(() => {
    if (!focusNodeId) return new Set();

    const ids = new Set([focusNodeId]);

    edges.forEach((edge) => {
      if (edge.source === focusNodeId) ids.add(edge.target);
      if (edge.target === focusNodeId) ids.add(edge.source);
    });

    return ids;
  }, [edges, focusNodeId]);


  const filteredNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      hidden:
        activeLayer !== "all" &&
        node.data?.layer !== activeLayer,
      style: {
        ...(node.style || {}),
        opacity:
          focusNodeId && !connectedNodeIds.has(node.id)
            ? 0.18
            : 1,
        filter:
          focusNodeId && node.id !== focusNodeId && connectedNodeIds.has(node.id)
            ? "brightness(1.18) saturate(1.15)"
            : "none",
      },
    }));
  }, [nodes, activeLayer, focusNodeId, connectedNodeIds]);


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
      edges.map((edge) => {
        const isFocusEdge =
          !!focusNodeId &&
          (edge.source === focusNodeId || edge.target === focusNodeId);

        return {
          ...edge,
          hidden:
            !visibleNodeIds.has(edge.source) ||
            !visibleNodeIds.has(edge.target),
          style: {
            ...(edge.style || {}),
            opacity:
              focusNodeId && !isFocusEdge
                ? 0.12
                : isFocusEdge
                  ? 1
                  : 0.75,
            strokeWidth: isFocusEdge ? 2.4 : 1.2,
          },
        };
      }),
    [edges, visibleNodeIds, focusNodeId]
  );


  function handleNodeClick(_, node) {
    setSelectedNode(node);
    setInspectorTab("overview");
  }


  function closeDetails() {
    setSelectedNode(null);
    setFocusNodeId(null);
    setInspectorTab("overview");
  }


  function toggleFocus(node) {
    setFocusNodeId((current) =>
      current === node.id ? null : node.id
    );
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
            repositoryId={repository?.id ?? repository?.repository_id}
            node={selectedNode}
            nodes={nodes}
            edges={edges}
            activeTab={inspectorTab}
            onTabChange={setInspectorTab}
            focused={focusNodeId === selectedNode.id}
            onFocus={() => toggleFocus(selectedNode)}
            onClose={closeDetails}
            onSelectNode={(nextNode) => {
              setSelectedNode(nextNode);
              setInspectorTab("overview");
            }}
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


function DetailsPanel({
  repositoryId,
  node,
  nodes,
  edges,
  activeTab,
  onTabChange,
  focused,
  onFocus,
  onClose,
  onSelectNode,
}) {
  const data = node.data || {};
  const layer =
    layerStyles[data.layer] || layerStyles.service;

  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [loadingFileAnalysis, setLoadingFileAnalysis] = useState(false);
  const [fileAnalysisError, setFileAnalysisError] = useState("");

  const exactFilePath =
    data.items?.length === 1
      ? data.items[0]
      : null;

  useEffect(() => {
    let cancelled = false;

    async function loadFileAnalysis() {
      if (activeTab !== "overview" || !repositoryId || !exactFilePath) {
        setFileAnalysis(null);
        setLoadingFileAnalysis(false);
        setFileAnalysisError("");
        return;
      }

      try {
        setLoadingFileAnalysis(true);
        setFileAnalysis(null);
        setFileAnalysisError("");

        const contentResponse = await fetch(
          `${API_BASE}/api/github/repositories/${repositoryId}/file-content?path=${encodeURIComponent(exactFilePath)}`,
          { credentials: "include" }
        );

        const contentData = await contentResponse.json();

        if (!contentResponse.ok) {
          throw new Error(
            contentData.detail ||
              "Unable to read the selected file."
          );
        }

        const filename =
          exactFilePath.split("/").pop() || exactFilePath;
        const language =
          data.languages?.length === 1
            ? data.languages[0]
            : undefined;

        const analysisResponse = await fetch(
          `${API_BASE}/api/github/repositories/${repositoryId}/file-intelligence`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: exactFilePath,
              filename,
              language,
              content: contentData.content || "",
            }),
          }
        );

        const analysisData = await analysisResponse.json();

        if (!analysisResponse.ok) {
          throw new Error(
            analysisData.detail ||
              "Unable to generate file intelligence."
          );
        }

        if (!cancelled) {
          setFileAnalysis(analysisData.analysis || null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Architecture file intelligence error:", error);
          setFileAnalysisError(
            error.message ||
              "Unable to analyze this file right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingFileAnalysis(false);
        }
      }
    }

    loadFileAnalysis();

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    repositoryId,
    exactFilePath,
    data.languages?.join("|"),
  ]);

  const connectedIds = new Set();
  const incoming = [];
  const outgoing = [];

  edges.forEach((edge) => {
    if (edge.target === node.id) {
      connectedIds.add(edge.source);
      incoming.push(edge.source);
    }

    if (edge.source === node.id) {
      connectedIds.add(edge.target);
      outgoing.push(edge.target);
    }
  });

  const connectedNodes = nodes.filter((item) =>
    connectedIds.has(item.id)
  );

  const incomingNodes = nodes.filter((item) =>
    incoming.includes(item.id)
  );

  const outgoingNodes = nodes.filter((item) =>
    outgoing.includes(item.id)
  );

  return (
    <aside className="absolute right-0 top-0 z-30 flex h-full w-[390px] flex-col overflow-hidden border-l border-white/10 bg-[#090b11]/97 shadow-[-20px_0_55px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${layer.color}, transparent)`,
          boxShadow: `0 0 24px ${layer.glow}`,
        }}
      />

      <div className="shrink-0 border-b border-white/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: layer.color,
                  boxShadow: `0 0 12px ${layer.color}`,
                }}
              />

              <p
                className="text-[10px] font-medium uppercase tracking-[0.2em]"
                style={{ color: layer.color }}
              >
                {layer.label} node
              </p>
            </div>

            <h2
              className="mt-2 truncate text-lg font-semibold text-white"
              title={data.title}
            >
              {data.title || "Unnamed module"}
            </h2>

            {data.path && (
              <p
                className="mt-1 truncate text-[11px] text-slate-600"
                title={data.path}
              >
                {data.path}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-white/[0.025] text-slate-500 transition hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
            aria-label="Close architecture inspector"
          >
            ×
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onFocus}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${
              focused
                ? "text-white"
                : "text-slate-400 hover:text-white"
            }`}
            style={{
              borderColor: focused
                ? `${layer.color}55`
                : "rgba(255,255,255,0.08)",
              background: focused
                ? `${layer.color}12`
                : "rgba(255,255,255,0.025)",
            }}
          >
            {focused ? "Focus mode on" : "Focus this node"}
          </button>

          <div className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2 text-[10px] text-slate-600">
            {connectedNodes.length} connected
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric
            label="Files"
            value={data.file_count ?? 0}
          />
          <Metric
            label="Incoming"
            value={data.incoming_relationships ?? 0}
          />
          <Metric
            label="Outgoing"
            value={data.outgoing_relationships ?? 0}
          />
        </div>

        <div className="mt-4 flex rounded-xl border border-white/5 bg-white/[0.018] p-1">
          {[
            ["overview", "Overview"],
            ["connections", "Connections"],
            ["files", "Files"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              className={`flex-1 rounded-lg px-2 py-2 text-[11px] transition ${
                activeTab === key
                  ? "bg-white/[0.07] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {activeTab === "overview" && (
          <div className="space-y-5">
            <InspectorSection
              eyebrow="What is it?"
              title="Repository role"
            >
              {loadingFileAnalysis ? (
                <div className="rounded-xl border border-purple-500/10 bg-purple-500/[0.035] p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        Reading this file
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        GitLoop is analyzing the actual source, structure, and behavior.
                      </p>
                    </div>
                  </div>
                </div>
              ) : fileAnalysis?.what_is_this_file ? (
                <p className="text-sm leading-7 text-slate-300">
                  {fileAnalysis.what_is_this_file}
                </p>
              ) : (
                <p className="text-sm leading-7 text-slate-400">
                  {data.file_count === 1
                    ? fileAnalysisError ||
                      data.description ||
                      "The role of this file could not be determined from the available source analysis."
                    : `This node groups ${data.file_count ?? 0} repository files. Exact file intelligence is shown when a node represents one file.`}
                </p>
              )}
            </InspectorSection>

            <InspectorSection
              eyebrow="Why is it here?"
              title="Architectural purpose"
            >
              <p className="text-sm leading-7 text-slate-300">
                {fileAnalysis?.why_is_this_file_used ||
                  (data.file_count === 1
                    ? (loadingFileAnalysis
                        ? "Analyzing why this file exists and what role its code performs..."
                        : fileAnalysisError ||
                          "The purpose of this file could not be determined from the available source alone.")
                    : `This node represents ${data.file_count ?? 0} files, so a single-file purpose would be misleading. Select a single-file node for source-grounded reasoning.`)}
              </p>
            </InspectorSection>

            <InspectorSection
              eyebrow="What does it do?"
              title="Key responsibilities"
            >
              {loadingFileAnalysis ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-11 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]"
                    />
                  ))}
                </div>
              ) : fileAnalysis?.what_it_does?.length ? (
                <div className="space-y-2">
                  {fileAnalysis.what_it_does.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.018] px-3 py-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-purple-400/20 bg-purple-400/[0.06] text-[10px] font-semibold text-purple-300">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-slate-300">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-slate-400">
                  {data.file_count === 1
                    ? fileAnalysisError ||
                      "No concrete responsibilities could be extracted from this file."
                    : `Select a single-file node to see the exact responsibilities implemented by that file.`}
                </p>
              )}
            </InspectorSection>

            <InspectorSection
              eyebrow="How does it connect?"
              title="System flow"
            >
              <div className="space-y-2">
                <FlowRow
                  label="Incoming"
                  value={incomingNodes.length}
                  description="modules that point into this node"
                  color={layer.color}
                />
                <FlowRow
                  label="Outgoing"
                  value={outgoingNodes.length}
                  description="modules this node points toward"
                  color={layer.color}
                />
              </div>
            </InspectorSection>

            {data.languages?.length > 0 && (
              <InspectorSection
                eyebrow="Technology"
                title="Languages detected"
              >
                <div className="flex flex-wrap gap-2">
                  {data.languages.map((language) => (
                    <span
                      key={language}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </InspectorSection>
            )}

            <div className="rounded-xl border border-white/5 bg-white/[0.018] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-700">
                  Architecture source
                </span>
                <span className="text-[10px] text-emerald-400/70">
                  Live repository
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                This inspector uses the module, relationship, language, and file data
                returned by GitLoop's repository architecture analysis.
              </p>
            </div>
          </div>
        )}

        {activeTab === "connections" && (
          <div className="space-y-5">
            <InspectorSection
              eyebrow="Inbound dependencies"
              title={`${incomingNodes.length} connected module${incomingNodes.length === 1 ? "" : "s"}`}
            >
              {incomingNodes.length === 0 ? (
                <EmptyState text="Nothing currently points to this node." />
              ) : (
                <ConnectionList
                  nodes={incomingNodes}
                  color={layer.color}
                  onSelectNode={onSelectNode}
                />
              )}
            </InspectorSection>

            <InspectorSection
              eyebrow="Outbound dependencies"
              title={`${outgoingNodes.length} connected module${outgoingNodes.length === 1 ? "" : "s"}`}
            >
              {outgoingNodes.length === 0 ? (
                <EmptyState text="This node has no outgoing relationship in the current map." />
              ) : (
                <ConnectionList
                  nodes={outgoingNodes}
                  color={layer.color}
                  onSelectNode={onSelectNode}
                />
              )}
            </InspectorSection>
          </div>
        )}

        {activeTab === "files" && (
          <InspectorSection
            eyebrow="Repository contents"
            title={`${data.items?.length ?? 0} file${(data.items?.length ?? 0) === 1 ? "" : "s"} in this node`}
          >
            {data.items?.length > 0 ? (
              <div className="space-y-1.5">
                {data.items.map((item) => (
                  <div
                    key={item}
                    className="group rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 transition hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <p
                      className="break-all text-[11px] leading-5 text-slate-400"
                      title={item}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No repository file list is available for this module." />
            )}
          </InspectorSection>
        )}
      </div>
    </aside>
  );
}


function InspectorSection({ eyebrow, title, children }) {
  return (
    <section>
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-700">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-sm font-medium text-slate-200">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}


function FlowRow({ label, value, description, color }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3">
      <span
        className="h-2 w-2 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-300">{label}</p>
        <p className="mt-0.5 text-[11px] text-slate-600">{description}</p>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}


function ConnectionList({ nodes, color, onSelectNode }) {
  return (
    <div className="space-y-2">
      {nodes.map((item) => {
        const itemData = item.data || {};
        const itemLayer =
          layerStyles[itemData.layer] || layerStyles.service;

        return (
          <button
            type="button"
            key={item.id}
            onClick={() => onSelectNode?.(item)}
            className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 text-left transition hover:border-white/10 hover:bg-white/[0.045]"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs"
                style={{
                  color: itemLayer.color,
                  background: `${itemLayer.color}12`,
                  border: `1px solid ${itemLayer.color}25`,
                }}
              >
                {itemData.icon || "◈"}
              </span>
              <div className="min-w-0">
                <p
                  className="truncate text-xs font-medium text-slate-300"
                  title={itemData.title}
                >
                  {itemData.title || "Unknown module"}
                </p>
                <p
                  className="mt-0.5 truncate text-[10px] text-slate-600"
                  title={itemData.description}
                >
                  {itemData.description || `${itemLayer.label} layer`}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-white/8 bg-white/[0.015] px-3 py-4 text-xs leading-5 text-slate-600">
      {text}
    </div>
  );
}

