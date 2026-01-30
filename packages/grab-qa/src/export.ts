import type { Annotation, AnnotationType, Priority } from './types';

const TYPE_LABELS: Record<AnnotationType, string> = {
  bug: 'Bug',
  enhancement: 'Enhancement',
  question: 'Question',
  nitpick: 'Nitpick',
};

const TYPE_LABELS_GITHUB: Record<AnnotationType, string> = {
  bug: 'bug',
  enhancement: 'enhancement',
  question: 'question',
  nitpick: 'documentation',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PRIORITY_LABELS_GITHUB: Record<Priority, string> = {
  critical: 'priority: critical',
  high: 'priority: high',
  medium: 'priority: medium',
  low: 'priority: low',
};

/**
 * Format a single annotation as markdown
 */
export function annotationToMarkdown(annotation: Annotation): string {
  const lines: string[] = [];

  lines.push(`## ${annotation.title}`);
  lines.push('');
  lines.push(`**Type:** ${TYPE_LABELS[annotation.type]} | **Priority:** ${PRIORITY_LABELS[annotation.priority]}`);
  lines.push('');

  if (annotation.description) {
    lines.push('### Description');
    lines.push(annotation.description);
    lines.push('');
  }

  lines.push('### Element Context');
  lines.push('```');
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
  lines.push('```');
  lines.push('');

  if (annotation.element.textContent) {
    lines.push('### Text Content');
    lines.push('```');
    lines.push(annotation.element.textContent);
    lines.push('```');
    lines.push('');
  }

  lines.push(`**Page:** ${annotation.pageUrl}`);
  lines.push(`**Created:** ${new Date(annotation.createdAt).toLocaleString()}`);

  return lines.join('\n');
}

/**
 * Export all annotations as markdown
 */
export function exportToMarkdown(annotations: Annotation[]): string {
  const lines: string[] = [];

  lines.push('# QA Session Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Total Issues: ${annotations.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  const byType = annotations.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  lines.push('## Summary');
  Object.entries(byType).forEach(([type, count]) => {
    lines.push(`- ${TYPE_LABELS[type as AnnotationType]}: ${count}`);
  });
  lines.push('');
  lines.push('---');
  lines.push('');

  annotations.forEach((annotation, index) => {
    lines.push(`### ${index + 1}. ${annotation.title}`);
    lines.push('');
    lines.push(annotationToMarkdown(annotation));
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Format annotation for GitHub Issue body
 */
export function formatGitHubIssueBody(annotation: Annotation): string {
  const lines: string[] = [];

  if (annotation.description) {
    lines.push(annotation.description);
    lines.push('');
  }

  lines.push('## Element Context');
  lines.push('');
  lines.push('| Property | Value |');
  lines.push('|----------|-------|');
  lines.push(`| Selector | \`${annotation.element.selector}\` |`);
  if (annotation.element.componentName) {
    lines.push(`| Component | \`${annotation.element.componentName}\` |`);
  }
  if (annotation.element.filePath) {
    lines.push(`| File | \`${annotation.element.filePath}\` |`);
  }
  lines.push(`| Tag | \`<${annotation.element.tagName}>\` |`);
  lines.push('');

  if (annotation.element.textContent) {
    lines.push('## Element Text');
    lines.push('```');
    lines.push(annotation.element.textContent.slice(0, 300));
    lines.push('```');
    lines.push('');
  }

  lines.push('## Metadata');
  lines.push(`- **Page:** ${annotation.pageUrl}`);
  lines.push(`- **Priority:** ${PRIORITY_LABELS[annotation.priority]}`);
  lines.push(`- **Created:** ${new Date(annotation.createdAt).toISOString()}`);
  lines.push('');
  lines.push('---');
  lines.push('*Captured with [GrabQA](https://github.com/shean-studios/grab-qa)*');

  return lines.join('\n');
}

/**
 * Get GitHub labels for an annotation
 */
export function getGitHubLabels(annotation: Annotation): string[] {
  const labels: string[] = ['qa'];

  labels.push(TYPE_LABELS_GITHUB[annotation.type]);
  labels.push(PRIORITY_LABELS_GITHUB[annotation.priority]);

  return labels;
}

/**
 * Format for Claude Code / AI context
 */
export function formatForAI(annotation: Annotation): string {
  const lines: string[] = [];

  lines.push(`# QA Issue: ${annotation.title}`);
  lines.push('');
  lines.push(`Type: ${TYPE_LABELS[annotation.type]}`);
  lines.push(`Priority: ${PRIORITY_LABELS[annotation.priority]}`);
  lines.push('');

  if (annotation.description) {
    lines.push('## Description');
    lines.push(annotation.description);
    lines.push('');
  }

  lines.push('## Element to Fix');
  if (annotation.element.filePath) {
    lines.push(`File: ${annotation.element.filePath}`);
  }
  if (annotation.element.componentName) {
    lines.push(`Component: ${annotation.element.componentName}`);
  }
  lines.push(`CSS Selector: ${annotation.element.selector}`);
  lines.push('');

  if (annotation.element.innerHTML) {
    lines.push('## Current HTML');
    lines.push('```html');
    lines.push(annotation.element.innerHTML.slice(0, 500));
    lines.push('```');
  }

  return lines.join('\n');
}

/**
 * Copy all annotations formatted for AI to clipboard
 */
export async function copyForAI(annotations: Annotation[]): Promise<void> {
  const content = annotations.map(formatForAI).join('\n\n---\n\n');
  await navigator.clipboard.writeText(content);
}
