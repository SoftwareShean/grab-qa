// src/context.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from "react";

// src/store.ts
var DEFAULT_STORAGE_KEY = "grab-qa-annotations";
function getStorageKey(customKey) {
  return customKey || DEFAULT_STORAGE_KEY;
}
function loadAnnotations(storageKey) {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    const data = JSON.parse(stored);
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn("[GrabQA] Failed to load annotations from storage");
    return [];
  }
}
function saveAnnotations(storageKey, annotations) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(annotations));
  } catch (error) {
    console.error("[GrabQA] Failed to save annotations:", error);
  }
}
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// src/element.ts
function getSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  const path = [];
  let current = element;
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break;
    }
    if (current.className && typeof current.className === "string") {
      const classes = current.className.trim().split(/\s+/).slice(0, 2);
      if (classes.length > 0 && classes[0]) {
        selector += `.${classes.join(".")}`;
      }
    }
    const parentEl = current.parentElement;
    if (parentEl) {
      const currentTagName = current.tagName;
      const siblings = Array.from(parentEl.children).filter(
        (child) => child.tagName === currentTagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    path.unshift(selector);
    current = parentEl;
  }
  return path.join(" > ");
}
function getReactInfo(element) {
  const fiberKey = Object.keys(element).find(
    (key) => key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")
  );
  if (!fiberKey) return {};
  try {
    const fiber = element[fiberKey];
    let current = fiber;
    let componentName;
    while (current) {
      const type = current.type;
      if (type && typeof type === "function") {
        componentName = type.displayName || type.name;
        if (componentName && !componentName.startsWith("_")) {
          break;
        }
      }
      current = current.return;
    }
    let filePath;
    if (fiber._debugSource) {
      const source = fiber._debugSource;
      if (source.fileName) {
        filePath = source.fileName;
        if (source.lineNumber) {
          filePath += `:${source.lineNumber}`;
        }
      }
    }
    return { componentName, filePath };
  } catch {
    return {};
  }
}
function getElementContext(element) {
  const reactInfo = getReactInfo(element);
  return {
    selector: getSelector(element),
    tagName: element.tagName.toLowerCase(),
    className: element.className || "",
    id: element.id || "",
    textContent: (element.textContent || "").slice(0, 200).trim(),
    innerHTML: element.innerHTML.slice(0, 500),
    boundingRect: element.getBoundingClientRect(),
    componentName: reactInfo.componentName,
    filePath: reactInfo.filePath
  };
}
function isGrabQAElement(element) {
  return element.closest("[data-grab-qa]") !== null;
}

// src/export.ts
var TYPE_LABELS = {
  bug: "Bug",
  enhancement: "Enhancement",
  question: "Question",
  nitpick: "Nitpick"
};
var TYPE_LABELS_GITHUB = {
  bug: "bug",
  enhancement: "enhancement",
  question: "question",
  nitpick: "documentation"
};
var PRIORITY_LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low"
};
var PRIORITY_LABELS_GITHUB = {
  critical: "priority: critical",
  high: "priority: high",
  medium: "priority: medium",
  low: "priority: low"
};
function annotationToMarkdown(annotation) {
  const lines = [];
  lines.push(`## ${annotation.title}`);
  lines.push("");
  lines.push(`**Type:** ${TYPE_LABELS[annotation.type]} | **Priority:** ${PRIORITY_LABELS[annotation.priority]}`);
  lines.push("");
  if (annotation.description) {
    lines.push("### Description");
    lines.push(annotation.description);
    lines.push("");
  }
  lines.push("### Element Context");
  lines.push("```");
  lines.push(`Selector: ${annotation.element.selector}`);
  if (annotation.element.componentName) {
    lines.push(`Component: ${annotation.element.componentName}`);
  }
  if (annotation.element.filePath) {
    lines.push(`File: ${annotation.element.filePath}`);
  }
  lines.push(`Tag: <${annotation.element.tagName}>`);
  if (annotation.element.id) {
    lines.push(`ID: ${annotation.element.id}`);
  }
  if (annotation.element.className) {
    lines.push(`Classes: ${annotation.element.className}`);
  }
  lines.push("```");
  lines.push("");
  if (annotation.element.textContent) {
    lines.push("### Text Content");
    lines.push("```");
    lines.push(annotation.element.textContent);
    lines.push("```");
    lines.push("");
  }
  lines.push(`**Page:** ${annotation.pageUrl}`);
  lines.push(`**Created:** ${new Date(annotation.createdAt).toLocaleString()}`);
  return lines.join("\n");
}
function exportToMarkdown(annotations) {
  const lines = [];
  lines.push("# QA Session Report");
  lines.push("");
  lines.push(`Generated: ${(/* @__PURE__ */ new Date()).toLocaleString()}`);
  lines.push(`Total Issues: ${annotations.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  const byType = annotations.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {}
  );
  lines.push("## Summary");
  Object.entries(byType).forEach(([type, count]) => {
    lines.push(`- ${TYPE_LABELS[type]}: ${count}`);
  });
  lines.push("");
  lines.push("---");
  lines.push("");
  annotations.forEach((annotation, index) => {
    lines.push(`### ${index + 1}. ${annotation.title}`);
    lines.push("");
    lines.push(annotationToMarkdown(annotation));
    lines.push("");
    lines.push("---");
    lines.push("");
  });
  return lines.join("\n");
}
function formatGitHubIssueBody(annotation) {
  const lines = [];
  if (annotation.description) {
    lines.push(annotation.description);
    lines.push("");
  }
  lines.push("## Element Context");
  lines.push("");
  lines.push("| Property | Value |");
  lines.push("|----------|-------|");
  lines.push(`| Selector | \`${annotation.element.selector}\` |`);
  if (annotation.element.componentName) {
    lines.push(`| Component | \`${annotation.element.componentName}\` |`);
  }
  if (annotation.element.filePath) {
    lines.push(`| File | \`${annotation.element.filePath}\` |`);
  }
  lines.push(`| Tag | \`<${annotation.element.tagName}>\` |`);
  lines.push("");
  if (annotation.element.textContent) {
    lines.push("## Element Text");
    lines.push("```");
    lines.push(annotation.element.textContent.slice(0, 300));
    lines.push("```");
    lines.push("");
  }
  lines.push("## Metadata");
  lines.push(`- **Page:** ${annotation.pageUrl}`);
  lines.push(`- **Priority:** ${PRIORITY_LABELS[annotation.priority]}`);
  lines.push(`- **Created:** ${new Date(annotation.createdAt).toISOString()}`);
  lines.push("");
  lines.push("---");
  lines.push("*Captured with [GrabQA](https://github.com/shean-studios/grab-qa)*");
  return lines.join("\n");
}
function getGitHubLabels(annotation) {
  const labels = ["qa"];
  labels.push(TYPE_LABELS_GITHUB[annotation.type]);
  labels.push(PRIORITY_LABELS_GITHUB[annotation.priority]);
  return labels;
}
function formatForAI(annotation) {
  const lines = [];
  lines.push(`# QA Issue: ${annotation.title}`);
  lines.push("");
  lines.push(`Type: ${TYPE_LABELS[annotation.type]}`);
  lines.push(`Priority: ${PRIORITY_LABELS[annotation.priority]}`);
  lines.push("");
  if (annotation.description) {
    lines.push("## Description");
    lines.push(annotation.description);
    lines.push("");
  }
  lines.push("## Element to Fix");
  if (annotation.element.filePath) {
    lines.push(`File: ${annotation.element.filePath}`);
  }
  if (annotation.element.componentName) {
    lines.push(`Component: ${annotation.element.componentName}`);
  }
  lines.push(`CSS Selector: ${annotation.element.selector}`);
  lines.push("");
  if (annotation.element.innerHTML) {
    lines.push("## Current HTML");
    lines.push("```html");
    lines.push(annotation.element.innerHTML.slice(0, 500));
    lines.push("```");
  }
  return lines.join("\n");
}
async function copyForAI(annotations) {
  const content = annotations.map(formatForAI).join("\n\n---\n\n");
  await navigator.clipboard.writeText(content);
}

// src/context.tsx
import { jsx } from "react/jsx-runtime";
var initialState = {
  isEnabled: false,
  isGrabbing: false,
  isPanelOpen: false,
  hoveredElement: null,
  selectedElement: null,
  annotations: [],
  currentSession: null
};
function reducer(state, action) {
  switch (action.type) {
    case "ENABLE":
      return { ...state, isEnabled: true };
    case "DISABLE":
      return { ...state, isEnabled: false, isGrabbing: false, hoveredElement: null };
    case "TOGGLE_GRAB":
      return {
        ...state,
        isGrabbing: !state.isGrabbing,
        hoveredElement: null,
        selectedElement: null
      };
    case "TOGGLE_PANEL":
      return { ...state, isPanelOpen: !state.isPanelOpen };
    case "SET_HOVERED":
      return { ...state, hoveredElement: action.element };
    case "SET_SELECTED":
      return { ...state, selectedElement: action.element, isGrabbing: false };
    case "SET_ANNOTATIONS":
      return { ...state, annotations: action.annotations };
    case "ADD_ANNOTATION":
      return { ...state, annotations: [...state.annotations, action.annotation] };
    case "UPDATE_ANNOTATION":
      return {
        ...state,
        annotations: state.annotations.map(
          (a) => a.id === action.id ? { ...a, ...action.updates, updatedAt: Date.now() } : a
        )
      };
    case "DELETE_ANNOTATION":
      return {
        ...state,
        annotations: state.annotations.filter((a) => a.id !== action.id)
      };
    case "CLEAR_ALL":
      return { ...state, annotations: [], selectedElement: null };
    default:
      return state;
  }
}
var GrabQAContext = createContext(null);
function GrabQAProvider({ children, config = {} }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const storageKey = getStorageKey(config.storageKey);
  const highlightRef = useRef(null);
  useEffect(() => {
    const stored = loadAnnotations(storageKey);
    if (stored.length > 0) {
      dispatch({ type: "SET_ANNOTATIONS", annotations: stored });
    }
  }, [storageKey]);
  useEffect(() => {
    saveAnnotations(storageKey, state.annotations);
  }, [state.annotations, storageKey]);
  useEffect(() => {
    const hotkey = config.hotkey || "KeyQ";
    const handleKeyDown = (e) => {
      if (e.altKey && e.code === hotkey) {
        e.preventDefault();
        dispatch({ type: state.isEnabled ? "DISABLE" : "ENABLE" });
      }
      if (e.key === "Escape" && state.isGrabbing) {
        dispatch({ type: "TOGGLE_GRAB" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config.hotkey, state.isEnabled, state.isGrabbing]);
  useEffect(() => {
    if (!state.isGrabbing) {
      if (highlightRef.current) {
        highlightRef.current.remove();
        highlightRef.current = null;
      }
      return;
    }
    const handleMouseMove = (e) => {
      const target = e.target;
      if (isGrabQAElement(target)) {
        dispatch({ type: "SET_HOVERED", element: null });
        return;
      }
      dispatch({ type: "SET_HOVERED", element: target });
      const rect = target.getBoundingClientRect();
      if (!highlightRef.current) {
        highlightRef.current = document.createElement("div");
        highlightRef.current.setAttribute("data-grab-qa", "highlight");
        document.body.appendChild(highlightRef.current);
      }
      highlightRef.current.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: rgba(59, 130, 246, 0.15);
        border: 2px dashed rgb(59, 130, 246);
        border-radius: 4px;
        pointer-events: none;
        z-index: 999998;
        transition: all 0.05s ease;
      `;
    };
    const handleClick = (e) => {
      const target = e.target;
      if (isGrabQAElement(target)) return;
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: "SET_SELECTED", element: target });
      dispatch({ type: "TOGGLE_PANEL" });
    };
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
      if (highlightRef.current) {
        highlightRef.current.remove();
        highlightRef.current = null;
      }
    };
  }, [state.isGrabbing]);
  const enable = useCallback(() => dispatch({ type: "ENABLE" }), []);
  const disable = useCallback(() => dispatch({ type: "DISABLE" }), []);
  const toggleGrabMode = useCallback(() => dispatch({ type: "TOGGLE_GRAB" }), []);
  const togglePanel = useCallback(() => dispatch({ type: "TOGGLE_PANEL" }), []);
  const selectElement = useCallback(
    (element) => dispatch({ type: "SET_SELECTED", element }),
    []
  );
  const clearSelection = useCallback(
    () => dispatch({ type: "SET_SELECTED", element: null }),
    []
  );
  const addAnnotation = useCallback(
    (data) => {
      const annotation = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      dispatch({ type: "ADD_ANNOTATION", annotation });
      config.onAnnotationCreate?.(annotation);
      return annotation;
    },
    [config]
  );
  const updateAnnotation = useCallback(
    (id, updates) => {
      dispatch({ type: "UPDATE_ANNOTATION", id, updates });
      const updated = state.annotations.find((a) => a.id === id);
      if (updated) {
        config.onAnnotationUpdate?.({ ...updated, ...updates });
      }
    },
    [config, state.annotations]
  );
  const deleteAnnotation = useCallback(
    (id) => dispatch({ type: "DELETE_ANNOTATION", id }),
    []
  );
  const exportToGitHubFn = useCallback(async () => {
    if (!config.githubRepo) {
      console.error("[GrabQA] No GitHub repo configured");
      return;
    }
    for (const annotation of state.annotations.filter((a) => !a.resolved)) {
      const body = formatGitHubIssueBody(annotation);
      const labels = getGitHubLabels(annotation);
      const params = new URLSearchParams({
        title: `[QA] ${annotation.title}`,
        body,
        labels: labels.join(",")
      });
      window.open(
        `https://github.com/${config.githubRepo}/issues/new?${params}`,
        "_blank"
      );
    }
  }, [config.githubRepo, state.annotations]);
  const exportToMarkdownFn = useCallback(() => {
    return exportToMarkdown(state.annotations);
  }, [state.annotations]);
  const exportToClipboard = useCallback(async () => {
    await copyForAI(state.annotations);
  }, [state.annotations]);
  const clearAll = useCallback(() => dispatch({ type: "CLEAR_ALL" }), []);
  const value = useMemo(
    () => ({
      ...state,
      enable,
      disable,
      toggleGrabMode,
      togglePanel,
      selectElement,
      clearSelection,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      exportToGitHub: exportToGitHubFn,
      exportToMarkdown: exportToMarkdownFn,
      exportToClipboard,
      clearAll
    }),
    [
      state,
      enable,
      disable,
      toggleGrabMode,
      togglePanel,
      selectElement,
      clearSelection,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      exportToGitHubFn,
      exportToMarkdownFn,
      exportToClipboard,
      clearAll
    ]
  );
  return /* @__PURE__ */ jsx(GrabQAContext.Provider, { value, children });
}
function useGrabQA() {
  const context = useContext(GrabQAContext);
  if (!context) {
    throw new Error("useGrabQA must be used within a GrabQAProvider");
  }
  return context;
}

// src/components/Toolbar.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function GrabQAToolbar() {
  const {
    isEnabled,
    isGrabbing,
    isPanelOpen,
    annotations,
    toggleGrabMode,
    togglePanel,
    disable
  } = useGrabQA();
  if (!isEnabled) return null;
  const unresolvedCount = annotations.filter((a) => !a.resolved).length;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-grab-qa": "toolbar",
      style: {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        background: "#1f2937",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        zIndex: 999999,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px"
      },
      children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: toggleGrabMode,
            style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background: isGrabbing ? "#3b82f6" : "#374151",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 500,
              transition: "all 0.15s"
            },
            children: [
              /* @__PURE__ */ jsx2("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx2("path", { d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" }) }),
              isGrabbing ? "Grabbing..." : "Grab Element"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: togglePanel,
            style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background: isPanelOpen ? "#3b82f6" : "#374151",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 500,
              position: "relative"
            },
            children: [
              /* @__PURE__ */ jsx2("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx2("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
              "Issues",
              unresolvedCount > 0 && /* @__PURE__ */ jsx2(
                "span",
                {
                  style: {
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    minWidth: "20px",
                    height: "20px",
                    padding: "0 6px",
                    background: "#ef4444",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  },
                  children: unresolvedCount
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx2("div", { style: { width: "1px", height: "24px", background: "#4b5563" } }),
        /* @__PURE__ */ jsx2(
          "button",
          {
            onClick: disable,
            style: {
              padding: "8px",
              background: "transparent",
              color: "#9ca3af",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            },
            title: "Close GrabQA (Alt+Q)",
            children: /* @__PURE__ */ jsx2("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx2("path", { d: "M18 6L6 18M6 6l12 12" }) })
          }
        )
      ]
    }
  );
}

// src/components/Panel.tsx
import { useState as useState2, useEffect as useEffect3 } from "react";

// src/components/Settings.tsx
import { useEffect as useEffect2, useState, useMemo as useMemo2 } from "react";

// src/github.ts
var STORAGE_KEY = "grab-qa-github-config";
function loadGitHubConfig() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
function saveGitHubConfig(config) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
function clearGitHubConfig() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
function parseGitHubUrl(url) {
  const patterns = [
    /github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/,
    /github\.com\/([^/]+)\/([^/]+)\/?$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }
  return null;
}
async function createGitHubIssue(config, annotation) {
  const body = formatGitHubIssueBody(annotation);
  const labels = getGitHubLabels(annotation);
  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: `[QA] ${annotation.title}`,
        body,
        labels
      })
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }
  return response.json();
}
async function createGitHubIssues(config, annotations) {
  const success = [];
  const failed = [];
  for (const annotation of annotations) {
    try {
      const issue = await createGitHubIssue(config, annotation);
      success.push(issue);
    } catch (error) {
      failed.push({
        annotation,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  return { success, failed };
}
async function fetchGitHubProjects(config) {
  const query = `
    query($owner: String!) {
      user(login: $owner) {
        projectsV2(first: 20) {
          nodes {
            id
            title
            url
          }
        }
      }
      organization(login: $owner) {
        projectsV2(first: 20) {
          nodes {
            id
            title
            url
          }
        }
      }
    }
  `;
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      variables: { owner: config.owner }
    })
  });
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  const userProjects = data.data?.user?.projectsV2?.nodes || [];
  const orgProjects = data.data?.organization?.projectsV2?.nodes || [];
  return [...userProjects, ...orgProjects].filter(Boolean);
}
async function verifyGitHubToken(token) {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (!response.ok) {
      return { valid: false, error: "Invalid token" };
    }
    const user = await response.json();
    const scopes = response.headers.get("x-oauth-scopes")?.split(", ") || [];
    return {
      valid: true,
      username: user.login,
      scopes
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Connection failed"
    };
  }
}
async function fetchUserRepos(token) {
  const response = await fetch(
    "https://api.github.com/user/repos?sort=pushed&per_page=50",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    }
  );
  if (!response.ok) return [];
  const repos = await response.json();
  return repos.map((r) => ({
    owner: r.owner.login,
    name: r.name,
    full_name: r.full_name
  }));
}

// src/components/Settings.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function Settings({ onClose, onSave }) {
  const [token, setToken] = useState("");
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [repos, setRepos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [showRepoList, setShowRepoList] = useState(false);
  const filteredRepos = useMemo2(() => {
    const sorted = [...repos].sort(
      (a, b) => a.full_name.toLowerCase().localeCompare(b.full_name.toLowerCase())
    );
    if (!repoSearch.trim()) return sorted;
    const search = repoSearch.toLowerCase();
    return sorted.filter(
      (repo) => repo.full_name.toLowerCase().includes(search) || repo.name.toLowerCase().includes(search)
    );
  }, [repos, repoSearch]);
  useEffect2(() => {
    const config = loadGitHubConfig();
    if (config) {
      setToken(config.token);
      setSelectedRepo(`${config.owner}/${config.repo}`);
      setRepoSearch(`${config.owner}/${config.repo}`);
      setSelectedProject(config.projectId || "");
      handleVerifyToken(config.token);
    }
  }, []);
  const handleVerifyToken = async (tokenToVerify) => {
    if (!tokenToVerify.trim()) return;
    setStatus("verifying");
    setError("");
    const result = await verifyGitHubToken(tokenToVerify);
    if (!result.valid) {
      setStatus("error");
      setError(result.error || "Invalid token");
      return;
    }
    setUsername(result.username || "");
    setStatus("loading");
    const userRepos = await fetchUserRepos(tokenToVerify);
    setRepos(userRepos);
    if (selectedRepo) {
      const [owner] = selectedRepo.split("/");
      const userProjects = await fetchGitHubProjects({ token: tokenToVerify, owner });
      setProjects(userProjects);
    }
    setStatus("success");
  };
  const handleRepoSelect = async (repoFullName) => {
    setSelectedRepo(repoFullName);
    setRepoSearch(repoFullName);
    setSelectedProject("");
    setShowRepoList(false);
    if (repoFullName && token) {
      const [owner] = repoFullName.split("/");
      const userProjects = await fetchGitHubProjects({ token, owner });
      setProjects(userProjects);
    }
  };
  const handleSave = () => {
    if (!selectedRepo) {
      setError("Please select a repository");
      return;
    }
    const [owner, repo] = selectedRepo.split("/");
    const config = {
      token,
      owner,
      repo,
      projectId: selectedProject || void 0
    };
    saveGitHubConfig(config);
    onSave(config);
    onClose();
  };
  const handleDisconnect = () => {
    clearGitHubConfig();
    setToken("");
    setSelectedRepo("");
    setRepoSearch("");
    setSelectedProject("");
    setRepos([]);
    setProjects([]);
    setStatus("idle");
    setUsername("");
  };
  return /* @__PURE__ */ jsx3(
    "div",
    {
      "data-grab-qa": "settings",
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1e6
      },
      onClick: (e) => e.target === e.currentTarget && onClose(),
      children: /* @__PURE__ */ jsxs2(
        "div",
        {
          style: {
            width: "420px",
            background: "#111827",
            borderRadius: "12px",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            overflow: "hidden"
          },
          children: [
            /* @__PURE__ */ jsxs2(
              "div",
              {
                style: {
                  padding: "16px 20px",
                  borderBottom: "1px solid #374151",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                },
                children: [
                  /* @__PURE__ */ jsx3("h3", { style: { margin: 0, color: "white", fontSize: "16px", fontWeight: 600 }, children: "GitHub Integration" }),
                  /* @__PURE__ */ jsx3(
                    "button",
                    {
                      onClick: onClose,
                      style: {
                        padding: "4px",
                        background: "transparent",
                        color: "#9ca3af",
                        border: "none",
                        cursor: "pointer"
                      },
                      children: /* @__PURE__ */ jsx3("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx3("path", { d: "M18 6L6 18M6 6l12 12" }) })
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxs2("div", { style: { padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }, children: [
              /* @__PURE__ */ jsxs2("div", { children: [
                /* @__PURE__ */ jsx3("label", { style: { display: "block", marginBottom: "6px", color: "#d1d5db", fontSize: "13px" }, children: "Personal Access Token" }),
                /* @__PURE__ */ jsxs2("div", { style: { display: "flex", gap: "8px" }, children: [
                  /* @__PURE__ */ jsx3(
                    "input",
                    {
                      type: "password",
                      value: token,
                      onChange: (e) => setToken(e.target.value),
                      placeholder: "ghp_xxxxxxxxxxxx",
                      style: {
                        flex: 1,
                        padding: "10px 12px",
                        background: "#1f2937",
                        color: "white",
                        border: "1px solid #374151",
                        borderRadius: "6px",
                        fontSize: "14px"
                      }
                    }
                  ),
                  /* @__PURE__ */ jsx3(
                    "button",
                    {
                      onClick: () => handleVerifyToken(token),
                      disabled: !token.trim() || status === "verifying",
                      style: {
                        padding: "10px 16px",
                        background: status === "success" ? "#10b981" : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: token.trim() && status !== "verifying" ? "pointer" : "not-allowed",
                        opacity: token.trim() ? 1 : 0.5,
                        fontSize: "13px",
                        fontWeight: 500
                      },
                      children: status === "verifying" ? "..." : status === "success" ? "\u2713" : "Verify"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs2("div", { style: { marginTop: "6px", fontSize: "12px", color: "#6b7280" }, children: [
                  "Need a token?",
                  " ",
                  /* @__PURE__ */ jsx3(
                    "a",
                    {
                      href: "https://github.com/settings/tokens/new?scopes=repo,project&description=GrabQA",
                      target: "_blank",
                      rel: "noopener noreferrer",
                      style: { color: "#60a5fa" },
                      children: "Create one here"
                    }
                  ),
                  " ",
                  "(needs repo + project scopes)"
                ] })
              ] }),
              username && /* @__PURE__ */ jsxs2(
                "div",
                {
                  style: {
                    padding: "10px 12px",
                    background: "#064e3b",
                    borderRadius: "6px",
                    color: "#6ee7b7",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  },
                  children: [
                    /* @__PURE__ */ jsx3("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx3("path", { d: "M20 6L9 17l-5-5" }) }),
                    "Connected as ",
                    /* @__PURE__ */ jsxs2("strong", { children: [
                      "@",
                      username
                    ] })
                  ]
                }
              ),
              error && /* @__PURE__ */ jsx3(
                "div",
                {
                  style: {
                    padding: "10px 12px",
                    background: "#7f1d1d",
                    borderRadius: "6px",
                    color: "#fca5a5",
                    fontSize: "13px"
                  },
                  children: error
                }
              ),
              repos.length > 0 && /* @__PURE__ */ jsxs2("div", { style: { position: "relative" }, children: [
                /* @__PURE__ */ jsx3("label", { style: { display: "block", marginBottom: "6px", color: "#d1d5db", fontSize: "13px" }, children: "Repository" }),
                /* @__PURE__ */ jsx3(
                  "input",
                  {
                    type: "text",
                    value: repoSearch,
                    onChange: (e) => {
                      setRepoSearch(e.target.value);
                      setShowRepoList(true);
                      if (e.target.value !== selectedRepo) {
                        setSelectedRepo("");
                      }
                    },
                    onFocus: () => setShowRepoList(true),
                    placeholder: "Search repositories...",
                    style: {
                      width: "100%",
                      padding: "10px 12px",
                      background: "#1f2937",
                      color: "white",
                      border: selectedRepo ? "1px solid #10b981" : "1px solid #374151",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }
                  }
                ),
                selectedRepo && /* @__PURE__ */ jsx3("div", { style: {
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(25%)",
                  color: "#10b981"
                }, children: /* @__PURE__ */ jsx3("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx3("path", { d: "M20 6L9 17l-5-5" }) }) }),
                showRepoList && filteredRepos.length > 0 && /* @__PURE__ */ jsx3(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: "4px",
                      maxHeight: "200px",
                      overflow: "auto",
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      zIndex: 10
                    },
                    children: filteredRepos.map((repo) => /* @__PURE__ */ jsxs2(
                      "button",
                      {
                        onClick: () => handleRepoSelect(repo.full_name),
                        style: {
                          display: "block",
                          width: "100%",
                          padding: "10px 12px",
                          background: selectedRepo === repo.full_name ? "#374151" : "transparent",
                          color: "white",
                          border: "none",
                          borderBottom: "1px solid #374151",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "13px"
                        },
                        onMouseEnter: (e) => {
                          if (selectedRepo !== repo.full_name) {
                            e.currentTarget.style.background = "#2d3748";
                          }
                        },
                        onMouseLeave: (e) => {
                          if (selectedRepo !== repo.full_name) {
                            e.currentTarget.style.background = "transparent";
                          }
                        },
                        children: [
                          /* @__PURE__ */ jsxs2("span", { style: { color: "#9ca3af" }, children: [
                            repo.owner,
                            "/"
                          ] }),
                          /* @__PURE__ */ jsx3("span", { style: { fontWeight: 500 }, children: repo.name })
                        ]
                      },
                      repo.full_name
                    ))
                  }
                ),
                showRepoList && repoSearch && filteredRepos.length === 0 && /* @__PURE__ */ jsxs2(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: "4px",
                      padding: "12px",
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#9ca3af",
                      fontSize: "13px",
                      textAlign: "center"
                    },
                    children: [
                      'No repositories matching "',
                      repoSearch,
                      '"'
                    ]
                  }
                )
              ] }),
              showRepoList && /* @__PURE__ */ jsx3(
                "div",
                {
                  style: {
                    position: "fixed",
                    inset: 0,
                    zIndex: 5
                  },
                  onClick: () => setShowRepoList(false)
                }
              ),
              projects.length > 0 && /* @__PURE__ */ jsxs2("div", { children: [
                /* @__PURE__ */ jsx3("label", { style: { display: "block", marginBottom: "6px", color: "#d1d5db", fontSize: "13px" }, children: "GitHub Project (optional)" }),
                /* @__PURE__ */ jsxs2(
                  "select",
                  {
                    value: selectedProject,
                    onChange: (e) => setSelectedProject(e.target.value),
                    style: {
                      width: "100%",
                      padding: "10px 12px",
                      background: "#1f2937",
                      color: "white",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      fontSize: "14px"
                    },
                    children: [
                      /* @__PURE__ */ jsx3("option", { value: "", children: "No project (issues only)" }),
                      projects.map((project) => /* @__PURE__ */ jsx3("option", { value: project.id, children: project.title }, project.id))
                    ]
                  }
                ),
                /* @__PURE__ */ jsx3("div", { style: { marginTop: "6px", fontSize: "12px", color: "#6b7280" }, children: "Issues will be automatically added to this project board" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs2(
              "div",
              {
                style: {
                  padding: "16px 20px",
                  borderTop: "1px solid #374151",
                  display: "flex",
                  justifyContent: "space-between"
                },
                children: [
                  username ? /* @__PURE__ */ jsx3(
                    "button",
                    {
                      onClick: handleDisconnect,
                      style: {
                        padding: "10px 16px",
                        background: "transparent",
                        color: "#f87171",
                        border: "1px solid #7f1d1d",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px"
                      },
                      children: "Disconnect"
                    }
                  ) : /* @__PURE__ */ jsx3("div", {}),
                  /* @__PURE__ */ jsxs2("div", { style: { display: "flex", gap: "8px" }, children: [
                    /* @__PURE__ */ jsx3(
                      "button",
                      {
                        onClick: onClose,
                        style: {
                          padding: "10px 16px",
                          background: "#374151",
                          color: "#d1d5db",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px"
                        },
                        children: "Cancel"
                      }
                    ),
                    /* @__PURE__ */ jsx3(
                      "button",
                      {
                        onClick: handleSave,
                        disabled: !selectedRepo,
                        style: {
                          padding: "10px 16px",
                          background: selectedRepo ? "#3b82f6" : "#4b5563",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: selectedRepo ? "pointer" : "not-allowed",
                          fontSize: "13px",
                          fontWeight: 500
                        },
                        children: "Save"
                      }
                    )
                  ] })
                ]
              }
            )
          ]
        }
      )
    }
  );
}

// src/components/Panel.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var TYPE_OPTIONS = [
  { value: "bug", label: "Bug", color: "#ef4444" },
  { value: "enhancement", label: "Enhancement", color: "#3b82f6" },
  { value: "question", label: "Question", color: "#8b5cf6" },
  { value: "nitpick", label: "Nitpick", color: "#6b7280" }
];
var PRIORITY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" }
];
function AnnotationForm({ onSubmit, onCancel, elementContext }) {
  const [type, setType] = useState2("bug");
  const [priority, setPriority] = useState2("medium");
  const [title, setTitle] = useState2("");
  const [description, setDescription] = useState2("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ type, priority, title: title.trim(), description: description.trim() });
  };
  return /* @__PURE__ */ jsxs3("form", { onSubmit: handleSubmit, style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
    /* @__PURE__ */ jsxs3("div", { style: { padding: "12px", background: "#1f2937", borderRadius: "8px", fontSize: "12px" }, children: [
      /* @__PURE__ */ jsx4("div", { style: { color: "#9ca3af", marginBottom: "4px" }, children: "Selected Element" }),
      /* @__PURE__ */ jsx4("code", { style: { color: "#60a5fa", wordBreak: "break-all" }, children: elementContext.componentName || elementContext.selector }),
      elementContext.filePath && /* @__PURE__ */ jsx4("div", { style: { marginTop: "4px", color: "#6b7280", fontSize: "11px" }, children: elementContext.filePath })
    ] }),
    /* @__PURE__ */ jsxs3("div", { children: [
      /* @__PURE__ */ jsx4("label", { style: { display: "block", marginBottom: "6px", color: "#d1d5db", fontSize: "13px" }, children: "Type" }),
      /* @__PURE__ */ jsx4("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: TYPE_OPTIONS.map((opt) => /* @__PURE__ */ jsx4(
        "button",
        {
          type: "button",
          onClick: () => setType(opt.value),
          style: {
            padding: "6px 12px",
            background: type === opt.value ? opt.color : "#374151",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 500
          },
          children: opt.label
        },
        opt.value
      )) })
    ] }),
    /* @__PURE__ */ jsxs3("div", { children: [
      /* @__PURE__ */ jsx4("label", { style: { display: "block", marginBottom: "6px", color: "#d1d5db", fontSize: "13px" }, children: "Priority" }),
      /* @__PURE__ */ jsx4(
        "select",
        {
          value: priority,
          onChange: (e) => setPriority(e.target.value),
          style: {
            width: "100%",
            padding: "8px 12px",
            background: "#374151",
            color: "white",
            border: "1px solid #4b5563",
            borderRadius: "6px",
            fontSize: "14px"
          },
          children: PRIORITY_OPTIONS.map((opt) => /* @__PURE__ */ jsx4("option", { value: opt.value, children: opt.label }, opt.value))
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("div", { children: [
      /* @__PURE__ */ jsx4("label", { style: { display: "block", marginBottom: "6px", color: "#d1d5db", fontSize: "13px" }, children: "Title *" }),
      /* @__PURE__ */ jsx4(
        "input",
        {
          type: "text",
          value: title,
          onChange: (e) => setTitle(e.target.value),
          placeholder: "Brief description of the issue",
          autoFocus: true,
          style: {
            width: "100%",
            padding: "8px 12px",
            background: "#374151",
            color: "white",
            border: "1px solid #4b5563",
            borderRadius: "6px",
            fontSize: "14px"
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("div", { children: [
      /* @__PURE__ */ jsx4("label", { style: { display: "block", marginBottom: "6px", color: "#d1d5db", fontSize: "13px" }, children: "Description" }),
      /* @__PURE__ */ jsx4(
        "textarea",
        {
          value: description,
          onChange: (e) => setDescription(e.target.value),
          placeholder: "Additional details, expected behavior, steps to reproduce...",
          rows: 3,
          style: {
            width: "100%",
            padding: "8px 12px",
            background: "#374151",
            color: "white",
            border: "1px solid #4b5563",
            borderRadius: "6px",
            fontSize: "14px",
            resize: "vertical"
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("div", { style: { display: "flex", gap: "8px", marginTop: "8px" }, children: [
      /* @__PURE__ */ jsx4(
        "button",
        {
          type: "button",
          onClick: onCancel,
          style: {
            flex: 1,
            padding: "10px",
            background: "#374151",
            color: "#d1d5db",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 500
          },
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx4(
        "button",
        {
          type: "submit",
          disabled: !title.trim(),
          style: {
            flex: 1,
            padding: "10px",
            background: title.trim() ? "#3b82f6" : "#4b5563",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: title.trim() ? "pointer" : "not-allowed",
            fontWeight: 500
          },
          children: "Add Issue"
        }
      )
    ] })
  ] });
}
function AnnotationCard({ annotation, onDelete, onToggleResolved, linkedIssue }) {
  const typeOption = TYPE_OPTIONS.find((t) => t.value === annotation.type);
  return /* @__PURE__ */ jsx4(
    "div",
    {
      style: {
        padding: "12px",
        background: annotation.resolved ? "#1f2937" : "#374151",
        borderRadius: "8px",
        borderLeft: `3px solid ${typeOption?.color || "#6b7280"}`,
        opacity: annotation.resolved ? 0.6 : 1
      },
      children: /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }, children: [
        /* @__PURE__ */ jsxs3("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsx4("div", { style: { fontWeight: 500, color: annotation.resolved ? "#9ca3af" : "white", textDecoration: annotation.resolved ? "line-through" : "none" }, children: annotation.title }),
          /* @__PURE__ */ jsxs3("div", { style: { fontSize: "12px", color: "#9ca3af", marginTop: "4px" }, children: [
            typeOption?.label,
            " \xB7 ",
            annotation.priority
          ] }),
          annotation.element.componentName && /* @__PURE__ */ jsx4("code", { style: { fontSize: "11px", color: "#60a5fa", display: "block", marginTop: "4px" }, children: annotation.element.componentName }),
          linkedIssue && /* @__PURE__ */ jsxs3(
            "a",
            {
              href: linkedIssue.html_url,
              target: "_blank",
              rel: "noopener noreferrer",
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "6px",
                padding: "2px 6px",
                background: "#1f2937",
                borderRadius: "4px",
                fontSize: "11px",
                color: "#60a5fa",
                textDecoration: "none"
              },
              children: [
                /* @__PURE__ */ jsxs3("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
                  /* @__PURE__ */ jsx4("circle", { cx: "12", cy: "12", r: "10" }),
                  /* @__PURE__ */ jsx4("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
                  /* @__PURE__ */ jsx4("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
                ] }),
                "#",
                linkedIssue.number
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs3("div", { style: { display: "flex", gap: "4px" }, children: [
          /* @__PURE__ */ jsx4(
            "button",
            {
              onClick: onToggleResolved,
              style: {
                padding: "4px",
                background: "transparent",
                color: annotation.resolved ? "#10b981" : "#6b7280",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px"
              },
              title: annotation.resolved ? "Mark unresolved" : "Mark resolved",
              children: /* @__PURE__ */ jsx4("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx4("path", { d: "M20 6L9 17l-5-5" }) })
            }
          ),
          /* @__PURE__ */ jsx4(
            "button",
            {
              onClick: onDelete,
              style: {
                padding: "4px",
                background: "transparent",
                color: "#6b7280",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px"
              },
              title: "Delete",
              children: /* @__PURE__ */ jsx4("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx4("path", { d: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }) })
            }
          )
        ] })
      ] })
    }
  );
}
function GrabQAPanel() {
  const {
    isEnabled,
    isPanelOpen,
    selectedElement,
    annotations,
    togglePanel,
    clearSelection,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    exportToClipboard
  } = useGrabQA();
  const [showForm, setShowForm] = useState2(false);
  const [showSettings, setShowSettings] = useState2(false);
  const [githubConfig, setGithubConfig] = useState2(null);
  const [isExporting, setIsExporting] = useState2(false);
  const [exportResult, setExportResult] = useState2(null);
  const [createdIssues, setCreatedIssues] = useState2(/* @__PURE__ */ new Map());
  useEffect3(() => {
    const config = loadGitHubConfig();
    setGithubConfig(config);
  }, []);
  if (!isEnabled || !isPanelOpen) return null;
  const elementContext = selectedElement ? getElementContext(selectedElement) : null;
  const unresolvedAnnotations = annotations.filter((a) => !a.resolved);
  const resolvedAnnotations = annotations.filter((a) => a.resolved);
  const handleSubmit = (data) => {
    if (!elementContext) return;
    addAnnotation({
      ...data,
      element: elementContext,
      pageUrl: window.location.href,
      resolved: false
    });
    setShowForm(false);
    clearSelection();
  };
  const handleExportToGitHub = async () => {
    if (!githubConfig) {
      setShowSettings(true);
      return;
    }
    const toExport = unresolvedAnnotations.filter(
      (a) => !createdIssues.has(a.id)
    );
    if (toExport.length === 0) {
      setExportResult({ success: 0, failed: 0 });
      return;
    }
    setIsExporting(true);
    setExportResult(null);
    try {
      const result = await createGitHubIssues(githubConfig, toExport);
      const newIssues = new Map(createdIssues);
      result.success.forEach((issue, index) => {
        const annotation = toExport[index];
        if (annotation) {
          newIssues.set(annotation.id, issue);
        }
      });
      setCreatedIssues(newIssues);
      setExportResult({
        success: result.success.length,
        failed: result.failed.length
      });
    } catch (error) {
      console.error("[GrabQA] Export failed:", error);
      setExportResult({ success: 0, failed: toExport.length });
    } finally {
      setIsExporting(false);
    }
  };
  const handleSettingsSave = (config) => {
    setGithubConfig(config);
  };
  return /* @__PURE__ */ jsxs3(Fragment, { children: [
    /* @__PURE__ */ jsxs3(
      "div",
      {
        "data-grab-qa": "panel",
        style: {
          position: "fixed",
          top: "20px",
          right: "20px",
          width: "360px",
          maxHeight: "calc(100vh - 100px)",
          background: "#111827",
          borderRadius: "12px",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)",
          zIndex: 999999,
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        },
        children: [
          /* @__PURE__ */ jsxs3(
            "div",
            {
              style: {
                padding: "16px",
                borderBottom: "1px solid #374151",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              },
              children: [
                /* @__PURE__ */ jsx4("h3", { style: { margin: 0, color: "white", fontSize: "16px", fontWeight: 600 }, children: "GrabQA" }),
                /* @__PURE__ */ jsxs3("div", { style: { display: "flex", gap: "4px" }, children: [
                  /* @__PURE__ */ jsx4(
                    "button",
                    {
                      onClick: () => setShowSettings(true),
                      style: {
                        padding: "6px",
                        background: githubConfig ? "#065f46" : "#374151",
                        color: githubConfig ? "#6ee7b7" : "#9ca3af",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "6px"
                      },
                      title: githubConfig ? `Connected: ${githubConfig.owner}/${githubConfig.repo}` : "Configure GitHub",
                      children: /* @__PURE__ */ jsx4("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx4("path", { d: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" }) })
                    }
                  ),
                  /* @__PURE__ */ jsx4(
                    "button",
                    {
                      onClick: togglePanel,
                      style: {
                        padding: "6px",
                        background: "transparent",
                        color: "#9ca3af",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "6px"
                      },
                      children: /* @__PURE__ */ jsx4("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx4("path", { d: "M18 6L6 18M6 6l12 12" }) })
                    }
                  )
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs3("div", { style: { flex: 1, overflow: "auto", padding: "16px" }, children: [
            selectedElement && !showForm && /* @__PURE__ */ jsx4("div", { style: { marginBottom: "16px" }, children: /* @__PURE__ */ jsxs3(
              "div",
              {
                style: {
                  padding: "12px",
                  background: "#1f2937",
                  borderRadius: "8px",
                  border: "1px dashed #3b82f6"
                },
                children: [
                  /* @__PURE__ */ jsx4("div", { style: { color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }, children: "Element selected" }),
                  /* @__PURE__ */ jsx4("code", { style: { color: "#60a5fa", fontSize: "13px" }, children: elementContext?.componentName || elementContext?.selector }),
                  /* @__PURE__ */ jsx4(
                    "button",
                    {
                      onClick: () => setShowForm(true),
                      style: {
                        display: "block",
                        width: "100%",
                        marginTop: "12px",
                        padding: "8px",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 500
                      },
                      children: "Add Annotation"
                    }
                  )
                ]
              }
            ) }),
            showForm && elementContext && /* @__PURE__ */ jsx4(
              AnnotationForm,
              {
                elementContext,
                onSubmit: handleSubmit,
                onCancel: () => {
                  setShowForm(false);
                  clearSelection();
                }
              }
            ),
            !showForm && /* @__PURE__ */ jsxs3(Fragment, { children: [
              unresolvedAnnotations.length > 0 && /* @__PURE__ */ jsxs3("div", { style: { marginBottom: "16px" }, children: [
                /* @__PURE__ */ jsxs3("div", { style: { color: "#9ca3af", fontSize: "12px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: [
                  "Open Issues (",
                  unresolvedAnnotations.length,
                  ")"
                ] }),
                /* @__PURE__ */ jsx4("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: unresolvedAnnotations.map((a) => /* @__PURE__ */ jsx4(
                  AnnotationCard,
                  {
                    annotation: a,
                    onDelete: () => deleteAnnotation(a.id),
                    onToggleResolved: () => updateAnnotation(a.id, { resolved: true }),
                    linkedIssue: createdIssues.get(a.id)
                  },
                  a.id
                )) })
              ] }),
              resolvedAnnotations.length > 0 && /* @__PURE__ */ jsxs3("div", { children: [
                /* @__PURE__ */ jsxs3("div", { style: { color: "#9ca3af", fontSize: "12px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: [
                  "Resolved (",
                  resolvedAnnotations.length,
                  ")"
                ] }),
                /* @__PURE__ */ jsx4("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: resolvedAnnotations.map((a) => /* @__PURE__ */ jsx4(
                  AnnotationCard,
                  {
                    annotation: a,
                    onDelete: () => deleteAnnotation(a.id),
                    onToggleResolved: () => updateAnnotation(a.id, { resolved: false }),
                    linkedIssue: createdIssues.get(a.id)
                  },
                  a.id
                )) })
              ] }),
              annotations.length === 0 && !selectedElement && /* @__PURE__ */ jsxs3("div", { style: { textAlign: "center", color: "#6b7280", padding: "32px 16px" }, children: [
                /* @__PURE__ */ jsx4("div", { style: { fontSize: "32px", marginBottom: "8px" }, children: "\u{1F3AF}" }),
                /* @__PURE__ */ jsx4("div", { children: 'Click "Grab Element" to start annotating' })
              ] })
            ] })
          ] }),
          exportResult && /* @__PURE__ */ jsxs3(
            "div",
            {
              style: {
                padding: "12px 16px",
                background: exportResult.failed === 0 ? "#065f46" : "#7f1d1d",
                color: exportResult.failed === 0 ? "#6ee7b7" : "#fca5a5",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              },
              children: [
                /* @__PURE__ */ jsxs3("span", { children: [
                  exportResult.success > 0 && `Created ${exportResult.success} issue${exportResult.success > 1 ? "s" : ""}`,
                  exportResult.failed > 0 && ` \xB7 ${exportResult.failed} failed`,
                  exportResult.success === 0 && exportResult.failed === 0 && "All issues already exported"
                ] }),
                /* @__PURE__ */ jsx4(
                  "button",
                  {
                    onClick: () => setExportResult(null),
                    style: {
                      padding: "2px",
                      background: "transparent",
                      color: "inherit",
                      border: "none",
                      cursor: "pointer"
                    },
                    children: "\u2715"
                  }
                )
              ]
            }
          ),
          annotations.length > 0 && !showForm && /* @__PURE__ */ jsxs3(
            "div",
            {
              style: {
                padding: "12px 16px",
                borderTop: "1px solid #374151",
                display: "flex",
                gap: "8px"
              },
              children: [
                /* @__PURE__ */ jsx4(
                  "button",
                  {
                    onClick: exportToClipboard,
                    style: {
                      flex: 1,
                      padding: "8px",
                      background: "#374151",
                      color: "#d1d5db",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px"
                    },
                    title: "Copy for AI coding agent",
                    children: "\u{1F4CB} Copy for AI"
                  }
                ),
                /* @__PURE__ */ jsx4(
                  "button",
                  {
                    onClick: handleExportToGitHub,
                    disabled: isExporting,
                    style: {
                      flex: 1,
                      padding: "8px",
                      background: githubConfig ? "#3b82f6" : "#374151",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: isExporting ? "wait" : "pointer",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    },
                    children: isExporting ? "..." : /* @__PURE__ */ jsxs3(Fragment, { children: [
                      /* @__PURE__ */ jsx4("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx4("path", { d: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" }) }),
                      githubConfig ? "Create Issues" : "Connect GitHub"
                    ] })
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    showSettings && /* @__PURE__ */ jsx4(
      Settings,
      {
        onClose: () => setShowSettings(false),
        onSave: handleSettingsSave
      }
    )
  ] });
}

// src/components/GrabQA.tsx
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function GrabQA({ children, config }) {
  if (typeof window === "undefined") {
    return /* @__PURE__ */ jsx5(Fragment2, { children });
  }
  return /* @__PURE__ */ jsxs4(GrabQAProvider, { config, children: [
    children,
    /* @__PURE__ */ jsx5(GrabQAToolbar, {}),
    /* @__PURE__ */ jsx5(GrabQAPanel, {})
  ] });
}
function GrabQAOverlay() {
  return /* @__PURE__ */ jsxs4(Fragment2, { children: [
    /* @__PURE__ */ jsx5(GrabQAToolbar, {}),
    /* @__PURE__ */ jsx5(GrabQAPanel, {})
  ] });
}
export {
  GrabQA,
  GrabQAOverlay,
  GrabQAPanel,
  GrabQAProvider,
  GrabQAToolbar,
  annotationToMarkdown,
  clearGitHubConfig,
  copyForAI,
  createGitHubIssue,
  createGitHubIssues,
  exportToMarkdown,
  fetchGitHubProjects,
  fetchUserRepos,
  formatForAI,
  formatGitHubIssueBody,
  generateId,
  getElementContext,
  getGitHubLabels,
  getSelector,
  isGrabQAElement,
  loadAnnotations,
  loadGitHubConfig,
  parseGitHubUrl,
  saveAnnotations,
  saveGitHubConfig,
  useGrabQA,
  verifyGitHubToken
};
