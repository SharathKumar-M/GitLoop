import { useEffect, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

const crispGithubTheme = {
  plain: { color: "#f5f7fa", background: "transparent" },
  comment: { color: "#8b949e", fontStyle: "italic" },
  prolog: { color: "#8b949e" },
  doctype: { color: "#8b949e" },
  cdata: { color: "#8b949e" },
  punctuation: { color: "#d8dee4" },
  property: { color: "#79c0ff" },
  tag: { color: "#7ee787" },
  boolean: { color: "#ff7b72" },
  number: { color: "#79c0ff" },
  constant: { color: "#79c0ff" },
  symbol: { color: "#79c0ff" },
  selector: { color: "#d2a8ff" },
  "attr-name": { color: "#79c0ff" },
  string: { color: "#a5d6ff" },
  char: { color: "#a5d6ff" },
  builtin: { color: "#ffa657" },
  inserted: { color: "#7ee787" },
  deleted: { color: "#ff7b72" },
  operator: { color: "#ff7b72" },
  entity: { color: "#d2a8ff" },
  url: { color: "#a5d6ff" },
  variable: { color: "#ffa657" },
  function: { color: "#d2a8ff" },
  regex: { color: "#a5d6ff" },
  important: { color: "#ff7b72" },
  keyword: { color: "#ff7b72" },
  "class-name": { color: "#ffa657" },
};



function IconBase({ children, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function FolderIcon({ open }) {
  return (
    <IconBase className="h-[17px] w-[17px]">
      <path d="M3.5 6.5C3.5 5.67 4.17 5 5 5h4l1.7 2H19c.83 0 1.5.67 1.5 1.5v8c0 .83-.67 1.5-1.5 1.5H5c-.83 0-1.5-.67-1.5-1.5v-10Z" fill={open ? "#F6C344" : "#D9A824"} opacity={open ? "0.98" : "0.82"} />
      <path d="M3.75 8.5h16.1" stroke="#FFE38A" strokeWidth="1" opacity="0.65" />
      {open && <path d="M4.7 9.4h14.6c.46 0 .78.43.63.86l-1.7 5.05a1 1 0 0 1-.95.69H5.25a1 1 0 0 1-.96-.71L3.8 10.27c-.13-.42.19-.87.63-.87Z" fill="#F2B938" opacity="0.3" />}
    </IconBase>
  );
}

function ReactIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="1.7" fill="#61DAFB" />
      <ellipse cx="12" cy="12" rx="9" ry="3.4" stroke="#61DAFB" strokeWidth="1.45" />
      <ellipse cx="12" cy="12" rx="9" ry="3.4" transform="rotate(60 12 12)" stroke="#61DAFB" strokeWidth="1.45" />
      <ellipse cx="12" cy="12" rx="9" ry="3.4" transform="rotate(120 12 12)" stroke="#61DAFB" strokeWidth="1.45" />
    </IconBase>
  );
}

function PythonIcon() {
  return (
    <IconBase>
      <path d="M11.5 3.5H8.7A2.7 2.7 0 0 0 6 6.2v3.1h4.1A1.9 1.9 0 0 1 12 11.2V5.9c0-.75-.43-1.42-1.08-1.74L11.5 3.5Z" fill="#3776AB" />
      <circle cx="9" cy="6.2" r="0.7" fill="#FFF" />
      <path d="M12.5 20.5h2.8a2.7 2.7 0 0 0 2.7-2.7v-3.1h-4.1A1.9 1.9 0 0 1 12 12.8v5.3c0 .75.43 1.42 1.08 1.74l-.58.66Z" fill="#FFD343" />
      <circle cx="15" cy="17.8" r="0.7" fill="#1F2937" />
      <path d="M10.1 9.3h3.8a2.1 2.1 0 0 1 2.1 2.1v1.2h-5.9a1.8 1.8 0 0 1-1.8-1.8v-.3c0-.66.44-1.2 1.8-1.2Z" fill="#3776AB" opacity="0.9" />
      <path d="M13.9 14.7h-3.8A2.1 2.1 0 0 1 8 12.6v-1.2h5.9a1.8 1.8 0 0 1 1.8 1.8v.3c0 .66-.44 1.2-1.8 1.2Z" fill="#FFD343" opacity="0.95" />
    </IconBase>
  );
}

function JsIcon() {
  return <IconBase><rect x="3" y="3" width="18" height="18" rx="2" fill="#F7DF1E" /><text x="12" y="16.4" textAnchor="middle" fontSize="9" fontWeight="800" fill="#111827" fontFamily="Arial, sans-serif">JS</text></IconBase>;
}

function TsIcon() {
  return <IconBase><rect x="3" y="3" width="18" height="18" rx="2" fill="#3178C6" /><text x="12" y="16.4" textAnchor="middle" fontSize="8.3" fontWeight="800" fill="white" fontFamily="Arial, sans-serif">TS</text></IconBase>;
}

function HtmlIcon() {
  return <IconBase><path d="M4 3h16l-1.45 17L12 22l-6.55-2L4 3Z" fill="#E44D26" /><path d="M12 6v12.1l3.9-1.1 1.05-11H12Z" fill="#F16529" opacity="0.85" /><text x="12" y="15.3" textAnchor="middle" fontSize="6.4" fontWeight="800" fill="white" fontFamily="Arial, sans-serif">HTML</text></IconBase>;
}

function CssIcon() {
  return <IconBase><path d="M4 3h16l-1.45 17L12 22l-6.55-2L4 3Z" fill="#1572B6" /><path d="M12 6v12.1l3.9-1.1 1.05-11H12Z" fill="#33A9DC" opacity="0.9" /><text x="12" y="15.3" textAnchor="middle" fontSize="6.4" fontWeight="800" fill="white" fontFamily="Arial, sans-serif">CSS</text></IconBase>;
}

function JsonIcon() {
  return <IconBase><rect x="3" y="3" width="18" height="18" rx="2" fill="#3B3B32" /><text x="12" y="15.8" textAnchor="middle" fontSize="9" fontWeight="800" fill="#F2C94C" fontFamily="ui-monospace, monospace">{`{}`}</text></IconBase>;
}

function MarkdownIcon() {
  return <IconBase><rect x="3" y="4" width="18" height="16" rx="2" fill="#6E7681" /><text x="12" y="15.7" textAnchor="middle" fontSize="7.2" fontWeight="800" fill="white" fontFamily="Arial, sans-serif">MD</text></IconBase>;
}

function JavaIcon() {
  return <IconBase><path d="M12 4c1.5 1.2.9 2.1.1 2.8-.9.8-1.65 1.38-.8 2.3.2-1.3 2.1-1.32 2.3-2.9.2-1.2-.8-1.77-1.6-2.2Z" fill="#F89820" /><path d="M8.1 11.2c1.03.74 1.9.92 3.9.92s2.87-.18 3.9-.92l-.42 1.43c-.83.55-1.8.78-3.48.78s-2.65-.23-3.48-.78l-.42-1.43Z" fill="#5382A1" /><path d="M7.2 14.15c1.13.93 2.54 1.3 4.8 1.3s3.67-.37 4.8-1.3l-.62 1.65c-.95.72-2.24 1.12-4.18 1.12s-3.23-.4-4.18-1.12l-.62-1.65Z" fill="#5382A1" /><path d="M9 18.2c1.22.47 2.07.6 3 .6s1.78-.13 3-.6c-.34.93-1.37 1.55-3 1.55s-2.66-.62-3-1.55Z" fill="#F89820" /></IconBase>;
}

function ShellIcon() {
  return <IconBase><rect x="3" y="4" width="18" height="16" rx="2" fill="#1B1F24" stroke="#8B949E" strokeWidth="1.2" /><path d="m7 9 2.8 2.5L7 14M11.7 15.2H17" stroke="#7EE787" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" /></IconBase>;
}

function FileIcon({ file }) {
  const extension = file?.extension?.toLowerCase();
  const filename = file?.filename?.toLowerCase();

  if (extension === ".jsx" || extension === ".tsx") return <ReactIcon />;
  if (extension === ".py") return <PythonIcon />;
  if (extension === ".js") return <JsIcon />;
  if (extension === ".ts") return <TsIcon />;
  if (extension === ".html") return <HtmlIcon />;
  if (extension === ".css" || extension === ".scss") return <CssIcon />;
  if (extension === ".json") return <JsonIcon />;
  if (extension === ".md" || extension === ".mdx") return <MarkdownIcon />;
  if (extension === ".java") return <JavaIcon />;
  if (extension === ".sh" || extension === ".bash") return <ShellIcon />;

  if (filename === "dockerfile") {
    return <IconBase><path d="M4 8.5h3v3H4v-3Zm4 0h3v3H8v-3Zm4 0h3v3h-3v-3Zm-8-4h3v3H4v-3Zm4 0h3v3H8v-3Zm4 0h3v3h-3v-3ZM8 12.5h7.5c1.15 0 2.17.37 2.92 1.1.58.57.96 1.32 1.08 2.17H8.1c-.78 0-1.44-.43-1.76-1.1-.26-.55-.19-1.4.16-2.17H8Z" fill="#2496ED" /></IconBase>;
  }

  if (file?.category === "documentation") return <MarkdownIcon />;
  if (file?.category === "config") return <JsonIcon />;

  return <IconBase><path d="M6 3.5h7l5 5V20.5H6V3.5Z" fill="#8B949E" opacity="0.82" /><path d="M13 3.5v5h5" fill="#B1BAC4" opacity="0.8" /><path d="M8.5 13h5.5M8.5 16h4" stroke="#E6EDF3" strokeWidth="1.15" strokeLinecap="round" opacity="0.9" /></IconBase>;
}

function getFileIcon(file) {
  return <FileIcon file={file} />;
}


function getFileTone(file) {
  if (file.category === "documentation") return "text-cyan-300";
  if (file.category === "config") return "text-amber-300";
  if (file.category === "code") return "text-purple-300";
  return "text-slate-500";
}


function formatFileSize(bytes) {
  if (!bytes) return "Unknown";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function getSyntaxLanguage(file) {
  const extension = file?.extension?.toLowerCase();

  const languages = {
    ".js": "javascript",
    ".jsx": "jsx",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".py": "python",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "cpp",
    ".hpp": "cpp",
    ".go": "go",
    ".rs": "rust",
    ".php": "php",
    ".rb": "ruby",
    ".swift": "swift",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".html": "markup",
    ".css": "css",
    ".scss": "scss",
    ".sql": "sql",
    ".sh": "bash",
    ".bash": "bash",
    ".json": "json",
    ".xml": "markup",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".mdx": "markdown",
  };

  return languages[extension] || "text";
}


function createTree(files) {
  const root = {
    type: "folder",
    name: "",
    path: "",
    children: [],
  };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;

      if (isFile) {
        current.children.push({
          type: "file",
          name: part,
          path: file.path,
          file,
        });
        return;
      }

      let folder = current.children.find(
        (child) =>
          child.type === "folder" &&
          child.name === part
      );

      if (!folder) {
        folder = {
          type: "folder",
          name: part,
          path: current.path
            ? `${current.path}/${part}`
            : part,
          children: [],
        };
        current.children.push(folder);
      }

      current = folder;
    });
  }

  function sortTree(node) {
    if (node.type !== "folder") return;

    node.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

    node.children.forEach(sortTree);
  }

  sortTree(root);
  return root;
}


function flattenFolders(node, result = []) {
  if (node.type !== "folder") return result;

  if (node.path) result.push(node.path);
  node.children.forEach((child) => flattenFolders(child, result));

  return result;
}


function TreeNode({
  node,
  depth = 0,
  selectedPath,
  onSelectFile,
  expandVersion,
  collapseVersion,
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (expandVersion > 0) setOpen(true);
  }, [expandVersion]);

  useEffect(() => {
    if (collapseVersion > 0) setOpen(false);
  }, [collapseVersion]);

  if (node.type === "file") {
    const selected = node.path === selectedPath;

    return (
      <button
        type="button"
        title={node.path}
        onClick={() => onSelectFile(node.file)}
        className={`group relative flex w-full items-center gap-2.5 rounded-xl py-2 pr-2 text-left text-sm transition ${
          selected
            ? "bg-purple-500/[0.12] text-white shadow-[inset_2px_0_0_rgba(168,85,247,0.9)]"
            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
        }`}
        style={{
          paddingLeft: `${depth * 15 + 10}px`,
        }}
      >
        <span
          className={`w-4 shrink-0 text-center text-xs ${
            selected ? "text-purple-300" : getFileTone(node.file)
          }`}
        >
          {getFileIcon(node.file)}
        </span>

        <span className="min-w-0 flex-1 truncate">
          {node.name}
        </span>

        <span
          className={`mr-1 h-1.5 w-1.5 shrink-0 rounded-full opacity-0 transition group-hover:opacity-100 ${
            selected ? "bg-purple-300 opacity-100" : "bg-slate-600"
          }`}
        />
      </button>
    );
  }

  return (
    <div>
      {node.name && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="group flex w-full items-center gap-2.5 rounded-xl py-2 pr-2 text-left text-sm text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
          style={{
            paddingLeft: `${depth * 15 + 10}px`,
          }}
        >
          <span className="w-4 text-center text-xs text-slate-600 transition group-hover:text-slate-400">
            {open ? "⌄" : "›"}
          </span>

          <FolderIcon open={open} />

          <span className="min-w-0 flex-1 truncate font-medium">
            {node.name}
          </span>
        </button>
      )}

      {open &&
        node.children.map((child) => (
          <TreeNode
            key={child.path || child.name}
            node={child}
            depth={node.name ? depth + 1 : depth}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            expandVersion={expandVersion}
            collapseVersion={collapseVersion}
          />
        ))}
    </div>
  );
}


function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}


function InfoBlock({ label, value, accent = "text-slate-300" }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
          {label}
        </p>
        <span className="h-1.5 w-1.5 rounded-full bg-slate-700 transition group-hover:bg-purple-400" />
      </div>
      <p className={`mt-2 break-words text-sm ${accent}`}>
        {value}
      </p>
    </div>
  );
}


function AIExplanationBlock({ title, text }) {
  return (
    <div className="rounded-2xl border border-purple-500/10 bg-purple-500/[0.035] p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-purple-400">
        {title}
      </p>

      <p className="mt-3 text-sm leading-7 text-slate-300">
        {text}
      </p>
    </div>
  );
}


function CopyButton({ label, copied, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
    >
      {copied ? "Copied" : label}
    </button>
  );
}


export default function Codebase({ repositoryId }) {
  const [files, setFiles] = useState([]);
  const [repository, setRepository] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [content, setContent] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showIntelligence, setShowIntelligence] = useState(true);

  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState("");

  const [expandVersion, setExpandVersion] = useState(0);
  const [collapseVersion, setCollapseVersion] = useState(0);
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAiAnalysis, setLoadingAiAnalysis] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState("");

  const aiRequestIdRef = useRef(0);

  const searchRef = useRef(null);

  useEffect(() => {
    async function loadFiles() {
      try {
        setLoadingFiles(true);
        setError("");

        const response = await fetch(
          `http://localhost:8000/api/github/repositories/${repositoryId}/files`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load repository files."
          );
        }

        const repositoryFiles = data.files || [];

        setFiles(repositoryFiles);
        setRepository(data);

        if (repositoryFiles.length > 0) {
          const firstCodeFile =
            repositoryFiles.find((file) => file.category === "code") ||
            repositoryFiles[0];
          setSelectedFile(firstCodeFile);
        } else {
          setSelectedFile(null);
        }
      } catch (requestError) {
        console.error("Codebase files error:", requestError);
        setError(requestError.message || "Unable to load repository files.");
      } finally {
        setLoadingFiles(false);
      }
    }

    loadFiles();
  }, [repositoryId]);


  useEffect(() => {
    async function loadContent() {
      if (!selectedFile) {
        setContent("");
        return;
      }

      try {
        setLoadingContent(true);

        const response = await fetch(
          `http://localhost:8000/api/github/repositories/${repositoryId}/file-content?path=${encodeURIComponent(
            selectedFile.path
          )}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load file content."
          );
        }

        setContent(data.content || "");
      } catch (requestError) {
        console.error("File content error:", requestError);
        setContent("");
      } finally {
        setLoadingContent(false);
      }
    }

    loadContent();
  }, [repositoryId, selectedFile]);


  useEffect(() => {
    const requestId = ++aiRequestIdRef.current;
    let cancelled = false;

    if (!selectedFile || loadingContent || !content.trim()) {
      setAiAnalysis(null);
      setAiAnalysisError("");
      setLoadingAiAnalysis(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadFileIntelligence() {
      try {
        setLoadingAiAnalysis(true);
        setAiAnalysis(null);
        setAiAnalysisError("");

        const response = await fetch(
          `http://localhost:8000/api/github/repositories/${repositoryId}/file-intelligence`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: selectedFile.path,
              filename: selectedFile.filename,
              language: selectedFile.language,
              content,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to analyze the selected file."
          );
        }

        if (
          !cancelled &&
          requestId === aiRequestIdRef.current
        ) {
          setAiAnalysis(data.analysis || null);
        }
      } catch (requestError) {
        if (
          !cancelled &&
          requestId === aiRequestIdRef.current
        ) {
          console.error(
            "File intelligence error:",
            requestError
          );
          setAiAnalysisError(
            requestError.message ||
              "Unable to analyze the selected file."
          );
        }
      } finally {
        if (
          !cancelled &&
          requestId === aiRequestIdRef.current
        ) {
          setLoadingAiAnalysis(false);
        }
      }
    }

    loadFileIntelligence();

    return () => {
      cancelled = true;
    };
  }, [
    repositoryId,
    selectedFile?.path,
    selectedFile?.filename,
    selectedFile?.language,
    content,
    loadingContent,
  ]);


  useEffect(() => {
    function handleKeyDown(event) {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA";

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  useEffect(() => {
    setCopiedPath(false);
    setCopiedCode(false);
  }, [selectedFile]);


  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return files.filter((file) => {
      const matchesSearch =
        !query ||
        file.path.toLowerCase().includes(query) ||
        file.filename?.toLowerCase().includes(query) ||
        file.language?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" || file.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [files, search, categoryFilter]);


  const tree = useMemo(
    () => createTree(filteredFiles),
    [filteredFiles]
  );


  const folderCount = useMemo(() => {
    return flattenFolders(tree).length;
  }, [tree]);


  const lineCount = content
    ? content.split("\n").length
    : 0;

  const nonEmptyLineCount = content
    ? content.split("\n").filter((line) => line.trim().length > 0).length
    : 0;

  const selectedPathParts = selectedFile?.path?.split("/") || [];

  const categoryCounts = useMemo(() => {
    return files.reduce(
      (accumulator, file) => {
        const category = file.category || "other";
        accumulator[category] = (accumulator[category] || 0) + 1;
        return accumulator;
      },
      {}
    );
  }, [files]);


  async function copyText(value, type) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);

      if (type === "path") {
        setCopiedPath(true);
        window.setTimeout(() => setCopiedPath(false), 1400);
      } else {
        setCopiedCode(true);
        window.setTimeout(() => setCopiedCode(false), 1400);
      }
    } catch (copyError) {
      console.error("Copy failed:", copyError);
    }
  }


  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-purple-300/80">
              Repository workspace
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Codebase
              </h1>

              {repository?.status && (
                <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[11px] text-emerald-300">
                  {repository.status}
                </span>
              )}
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Browse the indexed repository, jump through its structure, and inspect source files without leaving the workspace.
            </p>
          </div>

          {!loadingFiles && !error && files.length > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-1.5">
              <span className="hidden px-2 text-[10px] uppercase tracking-[0.18em] text-slate-600 sm:inline">
                Explorer
              </span>

              <button
                type="button"
                onClick={() => setExpandVersion((value) => value + 1)}
                className="rounded-xl px-3 py-1.5 text-xs text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
              >
                Expand all
              </button>

              <button
                type="button"
                onClick={() => setCollapseVersion((value) => value + 1)}
                className="rounded-xl px-3 py-1.5 text-xs text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
              >
                Collapse all
              </button>

              <button
                type="button"
                onClick={() => setShowIntelligence((value) => !value)}
                className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                  showIntelligence
                    ? "border-purple-400/20 bg-purple-400/[0.08] text-purple-200"
                    : "border-white/10 bg-white/[0.02] text-slate-500 hover:text-white"
                }`}
              >
                {showIntelligence ? "Hide insights" : "Show insights"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loadingFiles && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border border-purple-400/20 border-t-purple-400" />
          <p className="text-sm text-slate-400">Loading codebase...</p>
          <p className="mt-2 text-xs text-slate-600">
            Reading indexed file metadata from GitLoop.
          </p>
        </div>
      )}

      {/* Error */}
      {!loadingFiles && error && (
        <div className="rounded-3xl border border-red-500/10 bg-red-500/[0.03] p-8">
          <p className="text-sm text-red-300">{error}</p>
          <p className="mt-2 text-xs text-slate-600">
            Make sure this repository has been indexed first.
          </p>
        </div>
      )}

      {/* No files */}
      {!loadingFiles && !error && files.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/15 bg-purple-400/[0.06] text-2xl text-purple-300">
            ◇
          </div>
          <p className="mt-5 text-lg font-medium text-white">
            No indexed files found
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Index the repository to populate the Codebase explorer with real file metadata.
          </p>
        </div>
      )}

      {/* Workspace */}
      {!loadingFiles &&
        !error &&
        files.length > 0 && (
          <div
            className={`grid min-h-[710px] overflow-hidden rounded-3xl border border-white/10 bg-[#07070b]/95 shadow-[0_30px_100px_rgba(0,0,0,0.35)] ${
              showIntelligence
                ? "grid-cols-[280px_minmax(0,1fr)_330px]"
                : "grid-cols-[280px_minmax(0,1fr)]"
            }`}
          >
            {/* Explorer */}
            <aside className="flex min-h-0 flex-col border-r border-white/10 bg-white/[0.015]">
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                      File explorer
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">
                        {filteredFiles.length}
                      </span>
                      <span className="text-xs text-slate-600">
                        files · {folderCount} folders
                      </span>
                    </div>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-400/15 bg-purple-400/[0.05] text-sm text-purple-300">
                    ◈
                  </div>
                </div>

                {/* Search */}
                <div className="relative mt-4">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                    ⌕
                  </span>
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search files, paths, languages..."
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-10 text-xs text-white outline-none placeholder:text-slate-600 transition focus:border-purple-400/30 focus:bg-white/[0.035]"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-slate-600">
                    /
                  </span>
                </div>

                {/* Category filters */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    ["all", "All", files.length],
                    ["code", "Code", categoryCounts.code || 0],
                    ["config", "Config", categoryCounts.config || 0],
                    [
                      "documentation",
                      "Docs",
                      categoryCounts.documentation || 0,
                    ],
                    ["other", "Other", categoryCounts.other || 0],
                  ].map(([id, label, count]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCategoryFilter(id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[10px] transition ${
                        categoryFilter === id
                          ? "border-purple-400/20 bg-purple-400/[0.08] text-purple-200"
                          : "border-white/10 bg-white/[0.02] text-slate-600 hover:text-slate-300"
                      }`}
                    >
                      {label} {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {filteredFiles.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm text-slate-500">No matching files.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setCategoryFilter("all");
                      }}
                      className="mt-3 text-xs text-purple-400 hover:text-purple-300"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <TreeNode
                    node={tree}
                    selectedPath={selectedFile?.path}
                    onSelectFile={setSelectedFile}
                    expandVersion={expandVersion}
                    collapseVersion={collapseVersion}
                  />
                )}
              </div>

              <div className="border-t border-white/10 p-3">
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-600">
                    <span>Indexed set</span>
                    <span className="text-slate-500">{files.length}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-cyan-400" />
                  </div>
                </div>
              </div>
            </aside>

            {/* Source viewer */}
            <section className="flex min-w-0 min-h-0 flex-col bg-[#08090d]">
              {selectedFile ? (
                <>
                  <div className="border-b border-white/10 bg-white/[0.01]">
                    <div className="flex min-h-[68px] items-center justify-between gap-4 px-5">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-600">
                          {selectedPathParts.slice(0, -1).map((part, index) => (
                            <span key={`${part}-${index}`} className="truncate">
                              {part} /
                            </span>
                          ))}
                        </div>

                        <div className="mt-1.5 flex min-w-0 items-center gap-2">
                          <span className={`text-sm ${getFileTone(selectedFile)}`}>
                            {getFileIcon(selectedFile)}
                          </span>
                          <p className="truncate text-sm font-medium text-white">
                            {selectedFile.filename}
                          </p>
                          <span className="hidden rounded-md border border-white/10 bg-white/[0.025] px-2 py-0.5 text-[10px] text-slate-600 sm:inline">
                            {selectedFile.language || "Text"}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <CopyButton
                          label="Copy path"
                          copied={copiedPath}
                          onClick={() => copyText(selectedFile.path, "path")}
                        />
                        <CopyButton
                          label="Copy code"
                          copied={copiedCode}
                          onClick={() => copyText(content, "code")}
                        />
                      </div>
                    </div>

                    {/* File telemetry */}
                    <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-3">
                      <Metric label="Lines" value={lineCount || "—"} />
                      <Metric label="Non-empty" value={nonEmptyLineCount || "—"} />
                      <Metric label="Size" value={formatFileSize(selectedFile.size)} />
                      <Metric label="Type" value={selectedFile.category || "Unknown"} />
                      <Metric label="Extension" value={selectedFile.extension || "None"} />
                    </div>
                  </div>

                  <div className="relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_18%_0%,rgba(168,85,247,0.08),transparent_28%),radial-gradient(circle_at_82%_100%,rgba(34,211,238,0.05),transparent_30%),#07080c]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/35 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-10 border-r border-purple-300/[0.04] bg-purple-400/[0.012]" />
                    {loadingContent ? (
                      <div className="flex h-full min-h-[560px] items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border border-purple-400/20 border-t-purple-400" />
                          <p className="text-sm text-slate-500">Loading source...</p>
                        </div>
                      </div>
                    ) : (
                      <SyntaxHighlighter
                        language={getSyntaxLanguage(selectedFile)}
                        style={crispGithubTheme}
                        showLineNumbers
                        startingLineNumber={1}
                        wrapLongLines={false}
                        customStyle={{
                          margin: 0,
                          minHeight: "100%",
                          padding: "28px 28px 96px 18px",
                          background: "transparent",
                          fontSize: "13px",
                          lineHeight: "1.7",
                          letterSpacing: "0.01em",
                          textRendering: "geometricPrecision",
                        }}
                        lineNumberStyle={{
                          color: "#56606d",
                          minWidth: "4.2em",
                          paddingRight: "22px",
                          textAlign: "right",
                          userSelect: "none",
                          fontWeight: 500,
                        }}
                        codeTagProps={{
                          style: {
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            fontWeight: 500,
                            textShadow: "none",
                            WebkitFontSmoothing: "subpixel-antialiased",
                            MozOsxFontSmoothing: "auto",
                          },
                        }}
                      >
                        {content || "No source content available."}
                      </SyntaxHighlighter>
                    )}

                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center p-10 text-center">
                  <div>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/15 bg-purple-400/[0.05] text-xl text-purple-300">
                      ◇
                    </div>
                    <p className="mt-5 text-base font-medium text-slate-300">
                      Select a file to inspect
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Choose a file from the explorer to open its source and metadata.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Intelligence */}
            {showIntelligence && (
              <aside className="min-h-0 border-l border-white/10 bg-white/[0.012]">
                {selectedFile ? (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="border-b border-white/10 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-purple-400/90">
                            File intelligence
                          </p>

                          <h2 className="mt-2 break-words text-lg font-semibold text-white">
                            {selectedFile.filename}
                          </h2>

                          <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                            {selectedFile.path}
                          </p>

                          <p className="mt-2 text-[11px] text-slate-500">
                            {selectedFile.language || "Language not detected"}
                          </p>
                        </div>

                        <div
                          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm ${getFileTone(selectedFile)}`}
                        >
                          {getFileIcon(selectedFile)}
                        </div>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                      {loadingContent || loadingAiAnalysis ? (
                        <div className="flex min-h-[420px] items-center justify-center p-6 text-center">
                          <div>
                            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border border-purple-400/20 border-t-purple-400" />
                            <p className="text-sm text-slate-400">
                              {loadingContent
                                ? "Loading file..."
                                : "Analyzing this file..."}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-slate-600">
                              GitLoop is reading the selected file itself.
                            </p>
                          </div>
                        </div>
                      ) : aiAnalysisError ? (
                        <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-5">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-red-300">
                            Analysis unavailable
                          </p>
                          <p className="mt-3 text-sm leading-6 text-red-200/80">
                            {aiAnalysisError}
                          </p>
                          <p className="mt-3 text-xs leading-5 text-slate-600">
                            No fallback or generated placeholder is shown.
                          </p>
                        </div>
                      ) : aiAnalysis ? (
                        <div className="space-y-4">
                          <AIExplanationBlock
                            title="What is this file?"
                            text={aiAnalysis.what_is_this_file}
                          />

                          <AIExplanationBlock
                            title="Why is this file used?"
                            text={aiAnalysis.why_is_this_file_used}
                          />

                          <AIExplanationBlock
                            title="How does this file work?"
                            text={aiAnalysis.how_does_this_file_work}
                          />
                        </div>
                      ) : (
                        <div className="flex min-h-[420px] items-center justify-center p-6 text-center">
                          <div>
                            <p className="text-sm text-slate-500">
                              File intelligence
                            </p>
                            <p className="mt-2 text-xs leading-5 text-slate-700">
                              Select a readable file to generate its real code explanation.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 p-4">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
                            Source
                          </p>

                          <span className="text-[10px] text-slate-600">
                            {selectedFile.sha?.slice(0, 7) || "—"}
                          </span>
                        </div>

                        <p className="mt-2 truncate text-xs text-slate-400">
                          {selectedFile.path}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center">
                    <div>
                      <p className="text-sm text-slate-500">
                        File intelligence
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-700">
                        Select a file to analyze it.
                      </p>
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>
        )}
    </div>
  );
}
