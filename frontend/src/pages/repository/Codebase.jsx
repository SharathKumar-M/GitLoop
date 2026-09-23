import { useEffect, useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";


const githubDarkTheme = {
  'code[class*="language-"]': {
    color: "#e6edf3",
    background: "transparent",
  },

  'pre[class*="language-"]': {
    color: "#e6edf3",
    background: "transparent",
  },

  comment: {
    color: "#8b949e",
  },

  prolog: {
    color: "#8b949e",
  },

  doctype: {
    color: "#8b949e",
  },

  cdata: {
    color: "#8b949e",
  },

  punctuation: {
    color: "#c9d1d9",
  },

  property: {
    color: "#79c0ff",
  },

  tag: {
    color: "#7ee787",
  },

  boolean: {
    color: "#ff7b72",
  },

  number: {
    color: "#79c0ff",
  },

  constant: {
    color: "#79c0ff",
  },

  symbol: {
    color: "#ffa657",
  },

  deleted: {
    color: "#ffa198",
  },

  selector: {
    color: "#7ee787",
  },

  "attr-name": {
    color: "#79c0ff",
  },

  string: {
    color: "#a5d6ff",
  },

  char: {
    color: "#a5d6ff",
  },

  builtin: {
    color: "#ffa657",
  },

  inserted: {
    color: "#7ee787",
  },

  operator: {
    color: "#ff7b72",
  },

  entity: {
    color: "#d2a8ff",
  },

  url: {
    color: "#a5d6ff",
  },

  variable: {
    color: "#ffa657",
  },

  atrule: {
    color: "#d2a8ff",
  },

  "attr-value": {
    color: "#a5d6ff",
  },

  function: {
    color: "#d2a8ff",
  },

  "class-name": {
    color: "#ffa657",
  },

  keyword: {
    color: "#ff7b72",
  },

  regex: {
    color: "#a5d6ff",
  },

  important: {
    color: "#ff7b72",
    fontWeight: "bold",
  },
};


function getFileIcon(file) {
  if (file.category === "documentation") return "◈";
  if (file.category === "config") return "⚙";
  if (file.category === "code") return "◇";
  return "•";
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
    if (node.type !== "folder") {
      return;
    }

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


function TreeNode({
  node,
  depth = 0,
  selectedPath,
  onSelectFile,
}) {
  const [open, setOpen] = useState(true);

  if (node.type === "file") {
    const selected = node.path === selectedPath;

    return (
      <button
        type="button"
        onClick={() => onSelectFile(node.file)}
        className={`flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-sm transition ${
          selected
            ? "bg-purple-500/10 text-purple-300"
            : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
        }`}
        style={{
          paddingLeft: `${depth * 14 + 8}px`,
        }}
      >
        <span className="w-4 shrink-0 text-slate-500">
          {getFileIcon(node.file)}
        </span>

        <span className="truncate">
          {node.name}
        </span>
      </button>
    );
  }

  return (
    <div>
      {node.name && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-sm text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
          style={{
            paddingLeft: `${depth * 14 + 8}px`,
          }}
        >
          <span className="w-4 text-xs text-slate-500">
            {open ? "⌄" : "›"}
          </span>

          <span className="text-purple-300">
            📁
          </span>

          <span className="truncate">
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
          />
        ))}
    </div>
  );
}


export default function Codebase({ repositoryId }) {
  const [files, setFiles] = useState([]);
  const [repository, setRepository] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [content, setContent] = useState("");

  const [search, setSearch] = useState("");

  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);

  const [error, setError] = useState("");


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
            data.detail ||
              "Unable to load repository files."
          );
        }

        const repositoryFiles = data.files || [];

        setFiles(repositoryFiles);
        setRepository(data);

        if (repositoryFiles.length > 0) {
          const firstCodeFile =
            repositoryFiles.find(
              (file) => file.category === "code"
            ) || repositoryFiles[0];

          setSelectedFile(firstCodeFile);
        }
      } catch (error) {
        console.error(
          "Codebase files error:",
          error
        );

        setError(error.message);
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
            data.detail ||
              "Unable to load file content."
          );
        }

        setContent(data.content || "");
      } catch (error) {
        console.error(
          "File content error:",
          error
        );

        setContent("");
      } finally {
        setLoadingContent(false);
      }
    }

    loadContent();
  }, [repositoryId, selectedFile]);


  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return files;
    }

    return files.filter((file) =>
      file.path.toLowerCase().includes(query)
    );
  }, [files, search]);


  const tree = useMemo(
    () => createTree(filteredFiles),
    [filteredFiles]
  );


  return (
    <div className="mx-auto max-w-[1600px]">

      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-purple-400">
          Repository workspace
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Codebase
          </h1>

          {repository?.status && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              {repository.status}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Browse the indexed repository and inspect source files.
        </p>
      </div>


      {/* Loading */}
      {loadingFiles && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="text-sm text-slate-500">
            Loading codebase...
          </p>
        </div>
      )}


      {/* Error */}
      {!loadingFiles && error && (
        <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-8">
          <p className="text-sm text-red-400">
            {error}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Make sure this repository has been indexed first.
          </p>
        </div>
      )}


      {/* No Files */}
      {!loadingFiles &&
        !error &&
        files.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-sm text-slate-400">
              No indexed files found.
            </p>

            <p className="mt-2 text-xs text-slate-600">
              Index the repository to populate the Codebase explorer.
            </p>
          </div>
        )}


      {/* Codebase */}
      {!loadingFiles &&
        !error &&
        files.length > 0 && (
          <div className="mt-4 grid min-h-[680px] grid-cols-[260px_minmax(0,1fr)_300px] overflow-hidden rounded-2xl border border-white/10 bg-[#09090d]/80 shadow-2xl shadow-black/20">

            {/* File Explorer */}
            <aside className="border-r border-white/10 bg-black/10">

              <div className="border-b border-white/10 p-4">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Files
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {files.length} indexed
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search files..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/30"
                  />
                </div>

              </div>


              <div className="max-h-[610px] overflow-y-auto p-2">
                <TreeNode
                  node={tree}
                  selectedPath={selectedFile?.path}
                  onSelectFile={setSelectedFile}
                />
              </div>

            </aside>


            {/* Source Viewer */}
            <section className="min-w-0 border-r border-white/10">

              {selectedFile ? (
                <>
                  {/* File Header */}
                  <div className="flex h-16 items-center justify-between gap-4 border-b border-white/10 px-5">

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {selectedFile.filename}
                      </p>

                      <p className="truncate text-xs text-slate-600">
                        {selectedFile.path}
                      </p>
                    </div>

                    <div className="shrink-0 text-xs text-slate-500">
                      {selectedFile.language || "Text"}
                    </div>

                  </div>


                  {/* Code */}
                  <div className="h-[615px] overflow-auto bg-[#0d1117]">

                    {loadingContent ? (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-slate-600">
                          Loading source...
                        </p>
                      </div>
                    ) : (
                      <SyntaxHighlighter
                        language={getSyntaxLanguage(selectedFile)}
                        style={githubDarkTheme}
                        showLineNumbers
                        startingLineNumber={1}
                        wrapLongLines={false}
                        customStyle={{
                          margin: 0,
                          minHeight: "100%",
                          padding: "20px",
                          background: "#0d1117",
                          fontSize: "13px",
                          lineHeight: "1.6",
                        }}
                        lineNumberStyle={{
                          color: "#484f58",
                          minWidth: "3em",
                          paddingRight: "18px",
                          textAlign: "right",
                          userSelect: "none",
                        }}
                        codeTagProps={{
                          style: {
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          },
                        }}
                      >
                        {content ||
                          "No source content available."}
                      </SyntaxHighlighter>
                    )}

                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-slate-600">
                    Select a file to inspect it.
                  </p>
                </div>
              )}

            </section>


            {/* File Intelligence */}
            <aside className="bg-white/[0.015]">

              {selectedFile ? (
                <div className="h-full overflow-y-auto p-5">

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-purple-400">
                      File Intelligence
                    </p>

                    <h2 className="mt-2 break-words text-lg font-semibold text-white">
                      {selectedFile.filename}
                    </h2>

                    <p className="mt-1 break-words text-xs text-slate-600">
                      {selectedFile.path}
                    </p>
                  </div>


                  <div className="mt-6 space-y-4">

                    {/* Purpose */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-600">
                        Purpose
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        This file is part of the repository and is
                        classified as{" "}
                        <span className="text-slate-200">
                          {selectedFile.category}
                        </span>{" "}
                        file.
                      </p>
                    </div>


                    {/* Language */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-600">
                        Language
                      </p>

                      <p className="mt-2 text-sm text-slate-300">
                        {selectedFile.language ||
                          "Unknown"}
                      </p>
                    </div>


                    {/* File Size */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-600">
                        File Size
                      </p>

                      <p className="mt-2 text-sm text-slate-300">
                        {formatFileSize(
                          selectedFile.size
                        )}
                      </p>
                    </div>


                    {/* Extension */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-600">
                        Extension
                      </p>

                      <p className="mt-2 text-sm text-slate-300">
                        {selectedFile.extension ||
                          "None"}
                      </p>
                    </div>


                    {/* AI Summary */}
                    <div className="rounded-xl border border-purple-500/10 bg-purple-500/[0.04] p-4">
                      <p className="text-xs uppercase tracking-wider text-purple-400">
                        AI Summary
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        AI-generated file explanation will
                        appear here once GitLoop's code
                        understanding layer is connected.
                      </p>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <p className="text-sm text-slate-600">
                    Select a file to see file intelligence.
                  </p>
                </div>
              )}

            </aside>

          </div>
        )}

    </div>
  );
}