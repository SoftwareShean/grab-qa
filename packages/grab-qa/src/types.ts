export type AnnotationType = 'bug' | 'enhancement' | 'question' | 'nitpick';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface ElementContext {
  selector: string;
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  innerHTML: string;
  boundingRect: DOMRect | null;
  componentName?: string;
  filePath?: string;
  reactFiber?: unknown;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  priority: Priority;
  title: string;
  description: string;
  element: ElementContext;
  screenshot?: string;
  createdAt: number;
  updatedAt: number;
  pageUrl: string;
  resolved: boolean;
}

export interface QASession {
  id: string;
  name: string;
  annotations: Annotation[];
  createdAt: number;
  updatedAt: number;
  pageUrl: string;
}

export interface QAFlowConfig {
  storageKey?: string;
  hotkey?: string;
  position?: 'left' | 'right';
  theme?: 'light' | 'dark' | 'auto';
  githubRepo?: string;
  onAnnotationCreate?: (annotation: Annotation) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
  onExport?: (annotations: Annotation[]) => void;
}

export interface QAFlowState {
  isEnabled: boolean;
  isGrabbing: boolean;
  isPanelOpen: boolean;
  hoveredElement: HTMLElement | null;
  selectedElement: HTMLElement | null;
  annotations: Annotation[];
  currentSession: QASession | null;
}

export interface QAFlowActions {
  enable: () => void;
  disable: () => void;
  toggleGrabMode: () => void;
  togglePanel: () => void;
  selectElement: (element: HTMLElement) => void;
  clearSelection: () => void;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => Annotation;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  exportToGitHub: () => Promise<void>;
  exportToMarkdown: () => string;
  exportToClipboard: () => Promise<void>;
  clearAll: () => void;
}

export type QAFlowContextValue = QAFlowState & QAFlowActions;
