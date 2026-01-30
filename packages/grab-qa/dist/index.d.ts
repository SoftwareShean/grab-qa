import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

type AnnotationType = 'bug' | 'enhancement' | 'question' | 'nitpick';
type Priority = 'critical' | 'high' | 'medium' | 'low';
interface ElementContext {
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
interface Annotation {
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
interface QASession {
    id: string;
    name: string;
    annotations: Annotation[];
    createdAt: number;
    updatedAt: number;
    pageUrl: string;
}
interface QAFlowConfig {
    storageKey?: string;
    hotkey?: string;
    position?: 'left' | 'right';
    theme?: 'light' | 'dark' | 'auto';
    githubRepo?: string;
    onAnnotationCreate?: (annotation: Annotation) => void;
    onAnnotationUpdate?: (annotation: Annotation) => void;
    onExport?: (annotations: Annotation[]) => void;
}
interface QAFlowState {
    isEnabled: boolean;
    isGrabbing: boolean;
    isPanelOpen: boolean;
    hoveredElement: HTMLElement | null;
    selectedElement: HTMLElement | null;
    annotations: Annotation[];
    currentSession: QASession | null;
}
interface QAFlowActions {
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
type QAFlowContextValue = QAFlowState & QAFlowActions;

interface QAFlowProviderProps {
    children: React.ReactNode;
    config?: QAFlowConfig;
}
declare function QAFlowProvider({ children, config }: QAFlowProviderProps): react_jsx_runtime.JSX.Element;
declare function useQAFlow(): QAFlowContextValue;

interface QAFlowProps extends Omit<QAFlowProviderProps, 'children'> {
    children?: React.ReactNode;
}
/**
 * Main QAFlow component - wrap your app or specific pages with this
 *
 * @example
 * ```tsx
 * // In your layout or app
 * import { QAFlow } from 'qaflow';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       {process.env.NODE_ENV === 'development' && (
 *         <QAFlow config={{ githubRepo: 'user/repo' }} />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
declare function QAFlow({ children, config }: QAFlowProps): react_jsx_runtime.JSX.Element;
/**
 * Standalone overlay - use if you want manual control via useQAFlow hook
 */
declare function QAFlowOverlay(): react_jsx_runtime.JSX.Element;

declare function QAFlowToolbar(): react_jsx_runtime.JSX.Element | null;

declare function QAFlowPanel(): react_jsx_runtime.JSX.Element | null;

/**
 * Get a unique CSS selector for an element
 */
declare function getSelector(element: HTMLElement): string;
/**
 * Extract full context from a DOM element
 */
declare function getElementContext(element: HTMLElement): ElementContext;
/**
 * Check if element is part of QAFlow UI
 */
declare function isQAFlowElement(element: HTMLElement): boolean;

/**
 * Format a single annotation as markdown
 */
declare function annotationToMarkdown(annotation: Annotation): string;
/**
 * Export all annotations as markdown
 */
declare function exportToMarkdown(annotations: Annotation[]): string;
/**
 * Format annotation for GitHub Issue body
 */
declare function formatGitHubIssueBody(annotation: Annotation): string;
/**
 * Get GitHub labels for an annotation
 */
declare function getGitHubLabels(annotation: Annotation): string[];
/**
 * Format for Claude Code / AI context
 */
declare function formatForAI(annotation: Annotation): string;
/**
 * Copy all annotations formatted for AI to clipboard
 */
declare function copyForAI(annotations: Annotation[]): Promise<void>;

declare function loadAnnotations(storageKey: string): Annotation[];
declare function saveAnnotations(storageKey: string, annotations: Annotation[]): void;
declare function generateId(): string;

interface GitHubConfig {
    token: string;
    owner: string;
    repo: string;
    projectId?: string;
}
interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: 'open' | 'closed';
}
/**
 * Load GitHub config from localStorage
 */
declare function loadGitHubConfig(): GitHubConfig | null;
/**
 * Save GitHub config to localStorage
 */
declare function saveGitHubConfig(config: GitHubConfig): void;
/**
 * Clear GitHub config
 */
declare function clearGitHubConfig(): void;
/**
 * Detect git remote from common patterns
 * This is a fallback - ideally the build tool provides this
 */
declare function parseGitHubUrl(url: string): {
    owner: string;
    repo: string;
} | null;
/**
 * Create a GitHub issue via the API
 */
declare function createGitHubIssue(config: GitHubConfig, annotation: Annotation): Promise<GitHubIssue>;
/**
 * Create multiple issues and return results
 */
declare function createGitHubIssues(config: GitHubConfig, annotations: Annotation[]): Promise<{
    success: GitHubIssue[];
    failed: {
        annotation: Annotation;
        error: string;
    }[];
}>;
/**
 * Fetch user's GitHub Projects
 */
declare function fetchGitHubProjects(config: Pick<GitHubConfig, 'token' | 'owner'>): Promise<{
    id: string;
    title: string;
    url: string;
}[]>;
/**
 * Verify GitHub token has required permissions
 */
declare function verifyGitHubToken(token: string): Promise<{
    valid: boolean;
    username?: string;
    scopes?: string[];
    error?: string;
}>;
/**
 * Fetch repos the user has access to
 */
declare function fetchUserRepos(token: string): Promise<{
    owner: string;
    name: string;
    full_name: string;
}[]>;

export { type Annotation, type AnnotationType, type ElementContext, type GitHubConfig, type GitHubIssue, type Priority, QAFlow, type QAFlowActions, type QAFlowConfig, type QAFlowContextValue, QAFlowOverlay, QAFlowPanel, QAFlowProvider, type QAFlowState, QAFlowToolbar, type QASession, annotationToMarkdown, clearGitHubConfig, copyForAI, createGitHubIssue, createGitHubIssues, exportToMarkdown, fetchGitHubProjects, fetchUserRepos, formatForAI, formatGitHubIssueBody, generateId, getElementContext, getGitHubLabels, getSelector, isQAFlowElement, loadAnnotations, loadGitHubConfig, parseGitHubUrl, saveAnnotations, saveGitHubConfig, useQAFlow, verifyGitHubToken };
