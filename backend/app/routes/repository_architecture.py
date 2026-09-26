import ast
import base64
import io
import re
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import PurePosixPath

import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.github_installation import GitHubInstallation
from app.models.repository_file import RepositoryFile
from app.models.repository_index import RepositoryIndex
from app.routes.auth import get_current_user
from app.routes.repository_indexing import (
    GITHUB_API,
    github_headers,
    get_repository_tree,
    get_file_information,
    should_ignore,
)
from app.services.github_app_service import create_installation_access_token


router = APIRouter(
    tags=["Repository Architecture"],
)


MAX_ARCHIVE_BYTES = 80 * 1024 * 1024
MAX_ANALYZED_FILES = 600
MAX_CONTENT_BYTES_PER_FILE = 512 * 1024
MAX_ITEMS_PER_NODE = 8


CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".swift",
    ".kt",
    ".kts",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".css",
    ".scss",
    ".html",
}


TEXT_EXTENSIONS = CODE_EXTENSIONS | {
    ".json",
    ".yaml",
    ".yml",
    ".xml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
    ".md",
    ".mdx",
    ".sql",
    ".env.example",
}


LAYER_COLORS = {
    "frontend": "#a855f7",
    "api": "#38bdf8",
    "service": "#22c55e",
    "data": "#f59e0b",
    "external": "#f43f5e",
    "intelligence": "#06b6d4",
}


EXTERNAL_DETECTIONS = {
    "github": {
        "title": "GitHub",
        "layer": "external",
        "description": "External repository and Git hosting integration.",
        "patterns": (
            "api.github.com",
            "github.com",
            "github_app",
            "github_token",
            "github_client",
            "github installation",
            "GITHUB_",
        ),
    },
    "gemini": {
        "title": "Gemini",
        "layer": "external",
        "description": "External generative AI provider detected in the repository.",
        "patterns": (
            "generativelanguage.googleapis.com",
            "gemini",
            "GEMINI_API_KEY",
        ),
    },
    "postgresql": {
        "title": "PostgreSQL",
        "layer": "data",
        "description": "PostgreSQL database integration detected in repository code or configuration.",
        "patterns": (
            "postgresql://",
            "psycopg",
            "asyncpg",
            "postgres",
            "postgresql",
            "sqlalchemy",
        ),
    },
    "vector-store": {
        "title": "Vector Store",
        "layer": "intelligence",
        "description": "Vector search or embedding storage technology detected in the repository.",
        "patterns": (
            "pgvector",
            "qdrant",
            "chromadb",
            "faiss",
            "vectorstore",
            "vector store",
            "embedding",
            "embeddings",
        ),
    },
    "redis": {
        "title": "Redis",
        "layer": "data",
        "description": "Redis integration detected in repository code or configuration.",
        "patterns": (
            "redis",
            "REDIS_URL",
        ),
    },
}


def normalize_path(path: str) -> str:
    return path.replace("\\", "/").strip("/")


def module_key_for_path(path: str) -> str:
    """
    Turn repository files into meaningful architecture modules.

    Examples:
      frontend/src/pages/Home.jsx -> frontend/src/pages
      backend/app/routes/auth.py -> backend/app/routes
      backend/app/models/user.py -> backend/app/models
      README.md -> root
    """
    path_obj = PurePosixPath(path)
    parts = path_obj.parts

    if len(parts) <= 1:
        return "root"

    first = parts[0].lower()

    if first in {
        "frontend",
        "backend",
        "client",
        "server",
        "packages",
        "apps",
        "services",
        "src",
        "app",
        "lib",
    }:
        if len(parts) >= 3:
            depth = 3
        else:
            depth = len(parts) - 1
        return "/".join(parts[:depth])

    if len(parts) >= 2:
        return "/".join(parts[:2])

    return "root"


def layer_for_path(path: str) -> str:
    path_lower = normalize_path(path).lower()
    parts = set(PurePosixPath(path_lower).parts)
    filename = PurePosixPath(path_lower).name
    extension = PurePosixPath(path_lower).suffix

    intelligence_tokens = {
        "ai",
        "intelligence",
        "rag",
        "embedding",
        "embeddings",
        "vector",
        "llm",
        "chat",
        "search",
    }

    api_tokens = {
        "api",
        "route",
        "routes",
        "controller",
        "controllers",
        "endpoint",
        "endpoints",
        "views",
    }

    service_tokens = {
        "service",
        "services",
        "middleware",
        "handler",
        "handlers",
        "utility",
        "utilities",
        "utils",
    }

    data_tokens = {
        "db",
        "database",
        "databases",
        "model",
        "models",
        "migration",
        "migrations",
        "schema",
        "schemas",
        "repository",
        "repositories",
    }

    frontend_tokens = {
        "frontend",
        "client",
        "components",
        "pages",
        "hooks",
        "context",
        "contexts",
        "layouts",
        "layout",
        "public",
        "styles",
    }

    if parts.intersection(intelligence_tokens):
        return "intelligence"

    if parts.intersection(api_tokens):
        return "api"

    if parts.intersection(data_tokens):
        return "data"

    if parts.intersection(service_tokens):
        return "service"

    if parts.intersection(frontend_tokens):
        return "frontend"

    if "frontend" in parts or "client" in parts:
        return "frontend"

    if extension in {".jsx", ".tsx", ".css", ".scss", ".html"}:
        return "frontend"

    if "backend" in parts or "server" in parts:
        return "service"

    if filename in {
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "dockerfile",
        "docker-compose.yml",
        "docker-compose.yaml",
    }:
        return "service"

    return "service"


def parse_python_imports(content: str) -> list[str]:
    imports = []

    try:
        tree = ast.parse(content)
    except SyntaxError:
        return imports

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name:
                    imports.append(alias.name)

        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""

            if node.level:
                prefix = "." * node.level
                imports.append(prefix + module)

            elif module:
                imports.append(module)

    return imports


JS_IMPORT_RE = re.compile(
    r"""
    (?:
        import\s+(?:[\s\S]*?\s+from\s+)?|
        export\s+[\s\S]*?\s+from\s+|
        require\s*\(\s*|
        import\s*\(\s*
    )
    ['"]([^'"]+)['"]
    """,
    re.VERBOSE,
)


CSS_IMPORT_RE = re.compile(
    r'@import\s+(?:url\(\s*)?["\']([^"\']+)["\']',
    re.IGNORECASE,
)


HTML_REFERENCE_RE = re.compile(
    r'(?:src|href)\s*=\s*["\']([^"\']+)["\']',
    re.IGNORECASE,
)


def parse_javascript_imports(content: str) -> list[str]:
    imports = [
        match.group(1)
        for match in JS_IMPORT_RE.finditer(content)
    ]

    imports.extend(
        match.group(1)
        for match in CSS_IMPORT_RE.finditer(content)
    )

    imports.extend(
        match.group(1)
        for match in HTML_REFERENCE_RE.finditer(content)
    )

    return imports


def parse_imports(path: str, content: str) -> list[str]:
    extension = PurePosixPath(path).suffix.lower()

    if extension == ".py":
        return parse_python_imports(content)

    if extension in {
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".css",
        ".scss",
        ".html",
    }:
        return parse_javascript_imports(content)

    return []


def resolve_js_import(
    source_path: str,
    specifier: str,
    available_paths: set[str],
) -> str | None:
    if not specifier.startswith("."):
        return None

    source = PurePosixPath(source_path)
    base = (source.parent / specifier)

    candidates = [normalize_path(str(base))]

    for extension in (
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".json",
        ".css",
        ".scss",
        ".html",
    ):
        candidates.append(
            normalize_path(str(base)) + extension
        )

    for extension in (
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".json",
        ".css",
        ".scss",
        ".html",
    ):
        candidates.append(
            normalize_path(
                str(base / f"index{extension}")
            )
        )

    for candidate in candidates:
        if candidate in available_paths:
            return candidate

    return None


def resolve_python_import(
    source_path: str,
    specifier: str,
    available_paths: set[str],
) -> str | None:
    source = PurePosixPath(source_path)

    if specifier.startswith("."):
        dots = len(specifier) - len(specifier.lstrip("."))
        remainder = specifier[dots:].strip(".")

        base = source.parent

        for _ in range(max(dots - 1, 0)):
            base = base.parent

        candidate_parts = (
            list(base.parts)
            + ([part for part in remainder.split(".") if part])
        )

    else:
        candidate_parts = [
            part for part in specifier.split(".") if part
        ]

        # The repository's Python package is commonly rooted
        # below backend/, app/, src/ or server/.
        prefixes = [
            (),
            ("backend",),
            ("app",),
            ("src",),
            ("server",),
            ("backend", "app"),
        ]

        candidate_bases = [
            PurePosixPath(*prefix, *candidate_parts)
            for prefix in prefixes
        ]

        for base in candidate_bases:
            candidates = [
                normalize_path(str(base) + ".py"),
                normalize_path(
                    str(base / "__init__.py")
                ),
            ]

            for candidate in candidates:
                if candidate in available_paths:
                    return candidate

        return None

    base = PurePosixPath(*candidate_parts)

    candidates = [
        normalize_path(str(base) + ".py"),
        normalize_path(str(base / "__init__.py")),
    ]

    for candidate in candidates:
        if candidate in available_paths:
            return candidate

    return None


def resolve_import(
    source_path: str,
    specifier: str,
    available_paths: set[str],
) -> str | None:
    if not specifier:
        return None

    if specifier.startswith("."):
        if PurePosixPath(source_path).suffix.lower() == ".py":
            return resolve_python_import(
                source_path,
                specifier,
                available_paths,
            )

        return resolve_js_import(
            source_path,
            specifier,
            available_paths,
        )

    if PurePosixPath(source_path).suffix.lower() == ".py":
        return resolve_python_import(
            source_path,
            specifier,
            available_paths,
        )

    return None


def load_repository_archive(
    token: str,
    full_name: str,
    branch: str,
) -> dict[str, bytes]:
    response = requests.get(
        f"{GITHUB_API}/repos/{full_name}/zipball/{branch}",
        headers=github_headers(token),
        timeout=90,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to download the current "
                "repository snapshot from GitHub."
            ),
        )

    if len(response.content) > MAX_ARCHIVE_BYTES:
        return {}

    try:
        archive = zipfile.ZipFile(
            io.BytesIO(response.content)
        )
    except zipfile.BadZipFile as error:
        raise HTTPException(
            status_code=502,
            detail="GitHub returned an invalid repository archive.",
        ) from error

    files = {}

    for member in archive.infolist():
        if member.is_dir():
            continue

        member_path = normalize_path(member.filename)
        parts = PurePosixPath(member_path).parts

        if len(parts) <= 1:
            continue

        repository_path = "/".join(parts[1:])

        if len(files) >= MAX_ANALYZED_FILES:
            break

        if PurePosixPath(repository_path).suffix.lower() not in TEXT_EXTENSIONS:
            continue

        if member.file_size > MAX_CONTENT_BYTES_PER_FILE:
            continue

        try:
            files[repository_path] = archive.read(member)
        except (KeyError, RuntimeError, OSError):
            continue

    return files


def load_file_contents_via_blobs(
    token: str,
    full_name: str,
    tree_items: list[dict],
    allowed_paths: set[str],
) -> dict[str, bytes]:
    """
    Fallback for larger repositories where the complete zipball
    would be too large.
    """
    contents = {}

    candidates = [
        item
        for item in tree_items
        if item.get("type") == "blob"
        and item.get("path") in allowed_paths
        and item.get("sha")
        and (
            PurePosixPath(item["path"]).suffix.lower()
            in TEXT_EXTENSIONS
        )
        and (item.get("size") or 0)
        <= MAX_CONTENT_BYTES_PER_FILE
    ]

    candidates.sort(
        key=lambda item: item.get("size") or 0
    )

    candidates = candidates[:MAX_ANALYZED_FILES]

    session = requests.Session()

    for item in candidates:
        response = session.get(
            f"{GITHUB_API}/repos/{full_name}/git/blobs/{item['sha']}",
            headers=github_headers(token),
            timeout=30,
        )

        if response.status_code != 200:
            continue

        try:
            data = response.json()
            encoded = data.get("content")

            if not encoded:
                continue

            contents[item["path"]] = base64.b64decode(
                encoded
            )

        except (
            ValueError,
            TypeError,
            base64.binascii.Error,
        ):
            continue

    return contents


def decode_content(raw: bytes) -> str | None:
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return raw.decode("utf-8", errors="replace")
        except Exception:
            return None


def external_matches(text: str) -> set[str]:
    lowered = text.lower()
    matches = set()

    for key, definition in EXTERNAL_DETECTIONS.items():
        if any(
            pattern.lower() in lowered
            for pattern in definition["patterns"]
        ):
            matches.add(key)

    return matches


def module_description(
    module_key: str,
    files: list[dict],
    layer: str,
) -> str:
    language_counts = Counter(
        file["language"] or "Unknown"
        for file in files
    )

    language_summary = ", ".join(
        f"{language} ({count})"
        for language, count in language_counts.most_common(4)
    )

    if layer == "frontend":
        prefix = "Frontend module"
    elif layer == "api":
        prefix = "API module"
    elif layer == "service":
        prefix = "Application/service module"
    elif layer == "data":
        prefix = "Data/model module"
    elif layer == "intelligence":
        prefix = "AI/intelligence module"
    else:
        prefix = "Repository module"

    return (
        f"{prefix} discovered from the repository's actual "
        f"file structure. {len(files)} indexed files. "
        f"Languages: {language_summary or 'Not detected'}."
    )


def position_nodes(
    module_entries: list[dict],
    external_entries: list[dict],
) -> list[dict]:
    layer_order = [
        "frontend",
        "api",
        "service",
        "data",
        "intelligence",
    ]

    x_positions = {
        "frontend": 40,
        "api": 360,
        "service": 680,
        "data": 1000,
        "intelligence": 1000,
        "external": 1360,
    }

    counters = defaultdict(int)

    nodes = []

    for entry in module_entries:
        layer = entry["data"]["layer"]

        index = counters[layer]
        counters[layer] += 1

        y = 120 + (index % 6) * 190

        if layer == "intelligence" and index >= 4:
            y = 120 + (index % 6) * 190

        nodes.append(
            {
                **entry,
                "position": {
                    "x": x_positions.get(layer, 680),
                    "y": y,
                },
            }
        )

    external_index = 0

    for entry in external_entries:
        y = 100 + external_index * 180
        external_index += 1

        nodes.append(
            {
                **entry,
                "position": {
                    "x": x_positions["external"],
                    "y": y,
                },
            }
        )

    return nodes


def node_data(
    module_key: str,
    files: list[dict],
    incoming: int,
    outgoing: int,
) -> dict:
    layer = layer_for_path(module_key)

    sorted_files = sorted(
        files,
        key=lambda item: (
            item["path"].count("/"),
            item["path"],
        ),
    )

    items = [
        file["path"]
        for file in sorted_files[:MAX_ITEMS_PER_NODE]
    ]

    return {
        "layer": layer,
        "icon": "◈",
        "title": module_key,
        "description": module_description(
            module_key,
            files,
            layer,
        ),
        "items": items,
        "file_count": len(files),
        "incoming_relationships": incoming,
        "outgoing_relationships": outgoing,
        "languages": sorted(
            {
                file["language"]
                for file in files
                if file["language"]
            }
        ),
    }


@router.get(
    "/repositories/{repository_id}/architecture"
)
async def get_repository_architecture(
    repository_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["id"]

    repository_index = (
        db.query(RepositoryIndex)
        .filter(
            RepositoryIndex.user_id == user_id,
            RepositoryIndex.github_repository_id
            == repository_id,
        )
        .first()
    )

    if repository_index is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Repository has not been indexed yet. "
                "Index the repository before opening Architecture."
            ),
        )

    if repository_index.status not in {
        "COMPLETED",
        "PARTIAL",
    }:
        raise HTTPException(
            status_code=409,
            detail=(
                "Repository indexing is not complete. "
                f"Current status: {repository_index.status}."
            ),
        )

    installation = (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.user_id == user_id
        )
        .first()
    )

    if installation is None:
        raise HTTPException(
            status_code=400,
            detail="GitHub App installation not found.",
        )

    try:
        token = await create_installation_access_token(
            installation.installation_id
        )

        branch = (
            repository_index.branch
            or "main"
        )
        full_name = repository_index.full_name

        tree_data = get_repository_tree(
            token=token,
            full_name=full_name,
            branch=branch,
        )

        tree_items = tree_data.get("tree", [])

        live_files = []

        for item in tree_items:
            if item.get("type") != "blob":
                continue

            path = item.get("path")

            if not path:
                continue

            size = item.get("size")

            if should_ignore(path, size):
                continue

            live_files.append(
                {
                    "path": path,
                    "filename": PurePosixPath(path).name,
                    "language": None,
                    "size": size or 0,
                    "sha": item.get("sha"),
                }
            )

        indexed_metadata = {
            file.path: file
            for file in (
                db.query(RepositoryFile)
                .filter(
                    RepositoryFile.repository_index_id
                    == repository_index.id
                )
                .all()
            )
        }

        for file in live_files:
            metadata = indexed_metadata.get(
                file["path"]
            )

            if metadata is not None:
                file["language"] = metadata.language
            else:
                _, _, language, _ = get_file_information(
                    file["path"]
                )
                file["language"] = language

        # Architecture intentionally reads the current GitHub branch rather
        # than only the older indexed manifest. This keeps the architecture
        # view current even when files were added/removed after indexing.
        available_paths = {
            file["path"]
            for file in live_files
        }

        allowed_paths = available_paths

        archive_contents = load_repository_archive(
            token=token,
            full_name=full_name,
            branch=branch,
        )

        used_archive = bool(archive_contents)

        if not archive_contents:
            archive_contents = load_file_contents_via_blobs(
                token=token,
                full_name=full_name,
                tree_items=tree_items,
                allowed_paths=allowed_paths,
            )

        decoded_contents = {}

        for path, raw in archive_contents.items():
            text = decode_content(raw)

            if text is None:
                continue

            if len(text.encode("utf-8")) > (
                MAX_CONTENT_BYTES_PER_FILE
            ):
                continue

            decoded_contents[path] = text

        grouped_files = defaultdict(list)

        for file in live_files:
            grouped_files[
                module_key_for_path(file["path"])
            ].append(file)

        module_edges = Counter()

        outgoing_counts = Counter()
        incoming_counts = Counter()

        external_by_module = defaultdict(set)

        analyzed_files = 0
        import_relationships_found = 0

        for path, content in decoded_contents.items():
            if path not in available_paths:
                continue

            analyzed_files += 1

            source_module = module_key_for_path(
                path
            )

            for specifier in parse_imports(
                path,
                content,
            ):
                target_path = resolve_import(
                    path,
                    specifier,
                    available_paths,
                )

                if target_path is None:
                    continue

                target_module = module_key_for_path(
                    target_path
                )

                if target_module == source_module:
                    continue

                edge_key = (
                    source_module,
                    target_module,
                )

                module_edges[edge_key] += 1
                outgoing_counts[source_module] += 1
                incoming_counts[target_module] += 1
                import_relationships_found += 1

            for external_key in external_matches(
                content
            ):
                external_by_module[
                    source_module
                ].add(external_key)

        module_nodes = []

        for module_key, files in sorted(
            grouped_files.items()
        ):
            layer = layer_for_path(module_key)

            module_nodes.append(
                {
                    "id": f"module:{module_key}",
                    "type": "architecture",
                    "data": node_data(
                        module_key,
                        files,
                        incoming_counts[module_key],
                        outgoing_counts[module_key],
                    ),
                }
            )

        external_nodes = []

        detected_external = sorted(
            {
                external_key
                for matches in external_by_module.values()
                for external_key in matches
            }
        )

        for external_key in detected_external:
            detection = EXTERNAL_DETECTIONS[
                external_key
            ]

            external_nodes.append(
                {
                    "id": f"external:{external_key}",
                    "type": "architecture",
                    "data": {
                        "layer": detection["layer"],
                        "icon": "◎",
                        "title": detection["title"],
                        "description": detection["description"],
                        "items": [
                            "Detected from current repository source/configuration."
                        ],
                        "file_count": 0,
                        "incoming_relationships": 0,
                        "outgoing_relationships": 0,
                        "languages": [],
                    },
                }
            )

        nodes = position_nodes(
            module_nodes,
            external_nodes,
        )

        edges = []

        for (
            source_module,
            target_module,
        ), relationship_count in sorted(
            module_edges.items()
        ):
            source_id = f"module:{source_module}"
            target_id = f"module:{target_module}"

            source_layer = layer_for_path(
                source_module
            )

            color = LAYER_COLORS.get(
                source_layer,
                "#64748b",
            )

            edges.append(
                {
                    "id": (
                        f"edge:"
                        f"{source_module}"
                        f"->{target_module}"
                    ),
                    "source": source_id,
                    "target": target_id,
                    "animated": True,
                    "label": (
                        f"{relationship_count} import"
                        f"{'s' if relationship_count != 1 else ''}"
                    ),
                    "style": {
                        "stroke": color,
                        "strokeWidth": 2,
                        "strokeDasharray": "7 5",
                    },
                    "markerEnd": {
                        "type": "arrowclosed",
                        "color": color,
                    },
                }
            )

        for (
            source_module,
            external_keys,
        ) in sorted(
            external_by_module.items()
        ):
            source_id = f"module:{source_module}"

            for external_key in sorted(
                external_keys
            ):
                edge_id = (
                    f"edge:{source_module}"
                    f"->external:{external_key}"
                )

                detection = EXTERNAL_DETECTIONS[
                    external_key
                ]
                color = LAYER_COLORS[
                    detection["layer"]
                ]

                edges.append(
                    {
                        "id": edge_id,
                        "source": source_id,
                        "target": (
                            f"external:{external_key}"
                        ),
                        "animated": True,
                        "label": "detected integration",
                        "style": {
                            "stroke": color,
                            "strokeWidth": 1.7,
                            "strokeDasharray": "5 6",
                        },
                        "markerEnd": {
                            "type": "arrowclosed",
                            "color": color,
                        },
                    }
                )

        module_count = len(module_nodes)
        external_count = len(external_nodes)

        return {
            "repository": {
                "id": repository_id,
                "full_name": full_name,
                "branch": branch,
                "index_status": repository_index.status,
                "truncated": repository_index.truncated,
            },
            "stats": {
                "files": len(live_files),
                "modules": module_count,
                "external_systems": external_count,
                "relationships": len(edges),
                "import_relationships": import_relationships_found,
                "analyzed_files": analyzed_files,
            },
            "analysis": {
                "source": "live GitHub repository snapshot",
                "archive_used": used_archive,
                "content_limited": analyzed_files
                < len(live_files),
                "note": (
                    "Architecture nodes are derived from the current "
                    "GitHub branch and repository file tree. Internal "
                    "relationships are derived from imports/references "
                    "found in readable source files."
                ),
            },
            "nodes": nodes,
            "edges": edges,
            "generated_at": datetime.now(
                timezone.utc
            ).isoformat(),
        }

    except HTTPException:
        raise

    except requests.RequestException as error:
        print(
            "Repository architecture GitHub error:",
            error,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to read the current repository "
                "architecture from GitHub."
            ),
        ) from error

    except Exception as error:
        print(
            "Repository architecture error:",
            error,
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate the repository architecture."
            ),
        ) from error
