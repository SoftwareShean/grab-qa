'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type {
  Annotation,
  QAFlowConfig,
  QAFlowContextValue,
  QAFlowState,
} from './types';
import { generateId, getStorageKey, loadAnnotations, saveAnnotations } from './store';
import { getElementContext, isQAFlowElement } from './element';
import { copyForAI, exportToMarkdown, formatGitHubIssueBody, getGitHubLabels } from './export';

type Action =
  | { type: 'ENABLE' }
  | { type: 'DISABLE' }
  | { type: 'TOGGLE_GRAB' }
  | { type: 'TOGGLE_PANEL' }
  | { type: 'SET_HOVERED'; element: HTMLElement | null }
  | { type: 'SET_SELECTED'; element: HTMLElement | null }
  | { type: 'SET_ANNOTATIONS'; annotations: Annotation[] }
  | { type: 'ADD_ANNOTATION'; annotation: Annotation }
  | { type: 'UPDATE_ANNOTATION'; id: string; updates: Partial<Annotation> }
  | { type: 'DELETE_ANNOTATION'; id: string }
  | { type: 'CLEAR_ALL' };

const initialState: QAFlowState = {
  isEnabled: false,
  isGrabbing: false,
  isPanelOpen: false,
  hoveredElement: null,
  selectedElement: null,
  annotations: [],
  currentSession: null,
};

function reducer(state: QAFlowState, action: Action): QAFlowState {
  switch (action.type) {
    case 'ENABLE':
      return { ...state, isEnabled: true };
    case 'DISABLE':
      return { ...state, isEnabled: false, isGrabbing: false, hoveredElement: null };
    case 'TOGGLE_GRAB':
      return {
        ...state,
        isGrabbing: !state.isGrabbing,
        hoveredElement: null,
        selectedElement: null,
      };
    case 'TOGGLE_PANEL':
      return { ...state, isPanelOpen: !state.isPanelOpen };
    case 'SET_HOVERED':
      return { ...state, hoveredElement: action.element };
    case 'SET_SELECTED':
      return { ...state, selectedElement: action.element, isGrabbing: false };
    case 'SET_ANNOTATIONS':
      return { ...state, annotations: action.annotations };
    case 'ADD_ANNOTATION':
      return { ...state, annotations: [...state.annotations, action.annotation] };
    case 'UPDATE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.map((a) =>
          a.id === action.id ? { ...a, ...action.updates, updatedAt: Date.now() } : a
        ),
      };
    case 'DELETE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.filter((a) => a.id !== action.id),
      };
    case 'CLEAR_ALL':
      return { ...state, annotations: [], selectedElement: null };
    default:
      return state;
  }
}

const QAFlowContext = createContext<QAFlowContextValue | null>(null);

export interface QAFlowProviderProps {
  children: React.ReactNode;
  config?: QAFlowConfig;
}

export function QAFlowProvider({ children, config = {} }: QAFlowProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const storageKey = getStorageKey(config.storageKey);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  // Load annotations from storage on mount
  useEffect(() => {
    const stored = loadAnnotations(storageKey);
    if (stored.length > 0) {
      dispatch({ type: 'SET_ANNOTATIONS', annotations: stored });
    }
  }, [storageKey]);

  // Save annotations to storage when they change
  useEffect(() => {
    saveAnnotations(storageKey, state.annotations);
  }, [state.annotations, storageKey]);

  // Handle hotkey
  useEffect(() => {
    const hotkey = config.hotkey || 'KeyQ';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === hotkey) {
        e.preventDefault();
        dispatch({ type: state.isEnabled ? 'DISABLE' : 'ENABLE' });
      }
      if (e.key === 'Escape' && state.isGrabbing) {
        dispatch({ type: 'TOGGLE_GRAB' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.hotkey, state.isEnabled, state.isGrabbing]);

  // Handle mouse events for element selection
  useEffect(() => {
    if (!state.isGrabbing) {
      if (highlightRef.current) {
        highlightRef.current.remove();
        highlightRef.current = null;
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (isQAFlowElement(target)) {
        dispatch({ type: 'SET_HOVERED', element: null });
        return;
      }

      dispatch({ type: 'SET_HOVERED', element: target });

      // Update highlight
      const rect = target.getBoundingClientRect();
      if (!highlightRef.current) {
        highlightRef.current = document.createElement('div');
        highlightRef.current.setAttribute('data-qaflow', 'highlight');
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

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (isQAFlowElement(target)) return;

      e.preventDefault();
      e.stopPropagation();

      dispatch({ type: 'SET_SELECTED', element: target });
      dispatch({ type: 'TOGGLE_PANEL' });
    };

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      if (highlightRef.current) {
        highlightRef.current.remove();
        highlightRef.current = null;
      }
    };
  }, [state.isGrabbing]);

  const enable = useCallback(() => dispatch({ type: 'ENABLE' }), []);
  const disable = useCallback(() => dispatch({ type: 'DISABLE' }), []);
  const toggleGrabMode = useCallback(() => dispatch({ type: 'TOGGLE_GRAB' }), []);
  const togglePanel = useCallback(() => dispatch({ type: 'TOGGLE_PANEL' }), []);
  const selectElement = useCallback(
    (element: HTMLElement) => dispatch({ type: 'SET_SELECTED', element }),
    []
  );
  const clearSelection = useCallback(
    () => dispatch({ type: 'SET_SELECTED', element: null }),
    []
  );

  const addAnnotation = useCallback(
    (
      data: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>
    ): Annotation => {
      const annotation: Annotation = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'ADD_ANNOTATION', annotation });
      config.onAnnotationCreate?.(annotation);
      return annotation;
    },
    [config]
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      dispatch({ type: 'UPDATE_ANNOTATION', id, updates });
      const updated = state.annotations.find((a) => a.id === id);
      if (updated) {
        config.onAnnotationUpdate?.({ ...updated, ...updates });
      }
    },
    [config, state.annotations]
  );

  const deleteAnnotation = useCallback(
    (id: string) => dispatch({ type: 'DELETE_ANNOTATION', id }),
    []
  );

  const exportToGitHubFn = useCallback(async () => {
    if (!config.githubRepo) {
      console.error('[QAFlow] No GitHub repo configured');
      return;
    }

    for (const annotation of state.annotations.filter((a) => !a.resolved)) {
      const body = formatGitHubIssueBody(annotation);
      const labels = getGitHubLabels(annotation);

      // Open GitHub new issue URL
      const params = new URLSearchParams({
        title: `[QA] ${annotation.title}`,
        body,
        labels: labels.join(','),
      });

      window.open(
        `https://github.com/${config.githubRepo}/issues/new?${params}`,
        '_blank'
      );
    }
  }, [config.githubRepo, state.annotations]);

  const exportToMarkdownFn = useCallback(() => {
    return exportToMarkdown(state.annotations);
  }, [state.annotations]);

  const exportToClipboard = useCallback(async () => {
    await copyForAI(state.annotations);
  }, [state.annotations]);

  const clearAll = useCallback(() => dispatch({ type: 'CLEAR_ALL' }), []);

  const value = useMemo<QAFlowContextValue>(
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
      clearAll,
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
      clearAll,
    ]
  );

  return <QAFlowContext.Provider value={value}>{children}</QAFlowContext.Provider>;
}

export function useQAFlow(): QAFlowContextValue {
  const context = useContext(QAFlowContext);
  if (!context) {
    throw new Error('useQAFlow must be used within a QAFlowProvider');
  }
  return context;
}
