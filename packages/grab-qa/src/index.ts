// Main component
export { QAFlow, QAFlowOverlay } from './components/QAFlow';

// Context and hooks
export { QAFlowProvider, useQAFlow } from './context';

// Individual components
export { QAFlowToolbar } from './components/Toolbar';
export { QAFlowPanel } from './components/Panel';

// Utilities
export { getElementContext, getSelector, isQAFlowElement } from './element';
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
  QAFlowConfig,
  QAFlowState,
  QAFlowActions,
  QAFlowContextValue,
} from './types';
