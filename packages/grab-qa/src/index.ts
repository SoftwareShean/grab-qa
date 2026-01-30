// Main component
export { GrabQA, GrabQAOverlay } from './components/GrabQA';

// Context and hooks
export { GrabQAProvider, useGrabQA } from './context';

// Individual components
export { GrabQAToolbar } from './components/Toolbar';
export { GrabQAPanel } from './components/Panel';

// Utilities
export { getElementContext, getSelector, isGrabQAElement } from './element';
export {
  annotationToMarkdown,
  exportToMarkdown,
  formatGitHubIssueBody,
  getGitHubLabels,
  formatForAI,
  copyForAI,
} from './export';
export { loadAnnotations, saveAnnotations, generateId } from './store';

// GitHub integration
export {
  loadGitHubConfig,
  saveGitHubConfig,
  clearGitHubConfig,
  createGitHubIssue,
  createGitHubIssues,
  verifyGitHubToken,
  fetchUserRepos,
  fetchGitHubProjects,
  parseGitHubUrl,
} from './github';
export type { GitHubConfig, GitHubIssue } from './github';

// Types
export type {
  Annotation,
  AnnotationType,
  Priority,
  ElementContext,
  QASession,
  GrabQAConfig,
  GrabQAState,
  GrabQAActions,
  GrabQAContextValue,
} from './types';
