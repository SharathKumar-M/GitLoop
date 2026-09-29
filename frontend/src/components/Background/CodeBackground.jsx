import { useMemo } from "react";

const SYMBOLS = [
  "{ }",
  "< />",
  "( )",
  "[ ]",
  "=>",
  "::",
  "&&",
  "||",
  "#",
  "++",
  "</>",
  "git",
  "npm",
];

const CODE_LINES = [
  "import React from 'react';",
  "const repository = await analyzeRepository();",
  "git status --short",
  "GET /api/github/repositories",
  "function buildArchitecture() {",
  "return repository.modules;",
  "db.query(RepositoryIndex)",
  "const response = await fetch(url);",
  "export default GitLoop;",
  "if (indexed) {",
  "analyzeFile(source);",
  "repository.status = 'COMPLETED';",
  "git commit -m 'update'",
  "POST /ai-chat",
  "const dependencies = resolveImports();",
  "await createInstallationAccessToken();",
  "vectorStore.search(query);",
  "repository.files.map(analyze);",
  "architecture.build(graph);",
  "security.scan(source);",
];

const SYMBOL_POSITIONS = [
  { left: "5%", top: "-10%", delay: "0s", duration: "18s", size: "14px" },
  { left: "13%", top: "-18%", delay: "4s", duration: "23s", size: "11px" },
  { left: "22%", top: "-8%", delay: "7s", duration: "20s", size: "15px" },
  { left: "31%", top: "-20%", delay: "2s", duration: "25s", size: "12px" },
  { left: "42%", top: "-12%", delay: "6s", duration: "21s", size: "13px" },
  { left: "53%", top: "-18%", delay: "1s", duration: "24s", size: "12px" },
  { left: "64%", top: "-8%", delay: "8s", duration: "22s", size: "15px" },
  { left: "74%", top: "-20%", delay: "3s", duration: "26s", size: "11px" },
  { left: "84%", top: "-12%", delay: "5s", duration: "19s", size: "14px" },
  { left: "93%", top: "-18%", delay: "9s", duration: "24s", size: "12px" },
];

const CODE_POSITIONS = [
  { left: "2%", top: "-12%", delay: "0s", duration: "28s" },
  { left: "17%", top: "-20%", delay: "5s", duration: "33s" },
  { left: "32%", top: "-10%", delay: "9s", duration: "30s" },
  { left: "47%", top: "-18%", delay: "2s", duration: "35s" },
  { left: "63%", top: "-8%", delay: "7s", duration: "31s" },
  { left: "78%", top: "-16%", delay: "4s", duration: "34s" },
  { left: "92%", top: "-10%", delay: "10s", duration: "29s" },
];

export default function CodeBackground({
  opacity = 0.32,
  showSymbols = true,
  showCode = true,
}) {
  const symbolItems = useMemo(
    () =>
      SYMBOL_POSITIONS.map((position, index) => ({
        ...position,
        symbol: SYMBOLS[index % SYMBOLS.length],
      })),
    []
  );

  const codeItems = useMemo(
    () =>
      CODE_POSITIONS.map((position, index) => ({
        ...position,
        line: CODE_LINES[index % CODE_LINES.length],
      })),
    []
  );

  return (
    <>
      <style>{`
        @keyframes gitloop-code-fall {
          0% {
            transform: translate3d(0, -80px, 0);
            opacity: 0;
          }

          10% {
            opacity: 0.75;
          }

          50% {
            transform: translate3d(12px, 45vh, 0);
            opacity: 0.55;
          }

          85% {
            opacity: 0.6;
          }

          100% {
            transform: translate3d(-10px, 115vh, 0);
            opacity: 0;
          }
        }

        @keyframes gitloop-symbol-fall {
          0% {
            transform: translate3d(0, -60px, 0);
            opacity: 0;
          }

          12% {
            opacity: 0.9;
          }

          50% {
            transform: translate3d(-8px, 48vh, 0);
            opacity: 0.7;
          }

          88% {
            opacity: 0.75;
          }

          100% {
            transform: translate3d(10px, 112vh, 0);
            opacity: 0;
          }
        }

        @keyframes gitloop-packet-down {
          0% {
            transform: translateY(-40px);
            opacity: 0;
          }

          15% {
            opacity: 0.8;
          }

          50% {
            opacity: 0.45;
          }

          85% {
            opacity: 0.7;
          }

          100% {
            transform: translateY(110vh);
            opacity: 0;
          }
        }

        @keyframes gitloop-scan {
          0% {
            transform: translateY(-20%);
            opacity: 0;
          }

          20% {
            opacity: 0.15;
          }

          50% {
            opacity: 0.24;
          }

          80% {
            opacity: 0.12;
          }

          100% {
            transform: translateY(120%);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gitloop-motion {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
        style={{ opacity }}
      >
        {/* Soft vertical scan */}
        <div
          className="gitloop-motion absolute left-0 top-0 h-1/3 w-full"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(96,165,250,0.10), transparent)",
            animation: "gitloop-scan 10s linear infinite",
          }}
        />

        {/* Falling code */}
        {showCode &&
          codeItems.map((item, index) => (
            <div
              key={`code-${index}`}
              className="gitloop-motion absolute whitespace-nowrap font-mono text-[10px] text-cyan-100/70"
              style={{
                left: item.left,
                top: item.top,
                textShadow: "0 0 12px rgba(34,211,238,0.14)",
                animation: `gitloop-code-fall ${item.duration} linear ${item.delay} infinite`,
              }}
            >
              <span className="mr-3 text-cyan-300/80">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="text-slate-300/60">
                {item.line}
              </span>
            </div>
          ))}

        {/* Falling code symbols */}
        {showSymbols &&
          symbolItems.map((item, index) => (
            <div
              key={`symbol-${index}`}
              className="gitloop-motion absolute font-mono font-semibold"
              style={{
                left: item.left,
                top: item.top,
                fontSize: item.size,
                color:
                    index % 4 === 0
                        ? "rgba(4,211,238,0.85)"   // cyan
                        : index % 4 === 1
                        ? "rgba(96,165,250,0.75)"   // blue
                        : index % 4 === 2
                        ? "rgba(52,211,153,0.65)"   // emerald
                        : "rgba(203,213,225,0.65)",  // soft white

                textShadow:
                    index % 4 === 0
                        ? "0 0 16px rgba(34,211,238,0.65)"
                        : index % 4 === 1
                        ? "0 0 16px rgba(96,165,250,0.55)"
                        : index % 4 === 2
                        ? "0 0 14px rgba(52,211,153,0.45)"
                        : "0 0 10px rgba(203,213,225,0.25)",
                animation: `gitloop-symbol-fall ${item.duration} ease-in ${item.delay} infinite`,
              }}
            >
              {item.symbol}
            </div>
          ))}

        {/* Vertical data streams */}
        <div className="absolute left-[18%] top-0 h-full w-px bg-purple-400/[0.05]">
          <span
            className="gitloop-motion absolute left-1/2 top-0 h-20 w-px -translate-x-1/2 bg-purple-300/40 blur-[1px]"
            style={{
              animation: "gitloop-packet-down 7s linear infinite",
            }}
          />
        </div>

        <div className="absolute left-[46%] top-0 h-full w-px bg-cyan-400/[0.04]">
          <span
            className="gitloop-motion absolute left-1/2 top-0 h-24 w-px -translate-x-1/2 bg-cyan-300/30 blur-[1px]"
            style={{
              animation: "gitloop-packet-down 9s linear 2s infinite",
            }}
          />
        </div>

        <div className="absolute left-[77%] top-0 h-full w-px bg-purple-400/[0.04]">
          <span
            className="gitloop-motion absolute left-1/2 top-0 h-16 w-px -translate-x-1/2 bg-purple-300/30 blur-[1px]"
            style={{
              animation: "gitloop-packet-down 8s linear 4s infinite",
            }}
          />
        </div>

        {/* Horizontal data pulse */}
        <div
          className="absolute left-0 top-[28%] h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(168,85,247,0.10), transparent)",
          }}
        />

        <div
          className="absolute left-0 top-[72%] h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(34,211,238,0.07), transparent)",
          }}
        />

        {/* Ambient dark glows */}
        <div className="absolute -left-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-purple-500/[0.035] blur-3xl" />

        <div className="absolute -right-40 top-1/2 h-[32rem] w-[32rem] rounded-full bg-cyan-500/[0.025] blur-3xl" />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/25" />
      </div>
    </>
  );
}