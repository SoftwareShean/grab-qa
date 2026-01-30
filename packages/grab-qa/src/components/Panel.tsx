'use client';

import React, { useState, useEffect } from 'react';
import { useQAFlow } from '../context';
import { getElementContext } from '../element';
import type { Annotation, AnnotationType, Priority } from '../types';
import { Settings } from './Settings';
import {
  loadGitHubConfig,
  createGitHubIssues,
  type GitHubConfig,
  type GitHubIssue,
} from '../github';

const TYPE_OPTIONS: { value: AnnotationType; label: string; color: string }[] = [
  { value: 'bug', label: 'Bug', color: '#ef4444' },
  { value: 'enhancement', label: 'Enhancement', color: '#3b82f6' },
  { value: 'question', label: 'Question', color: '#8b5cf6' },
  { value: 'nitpick', label: 'Nitpick', color: '#6b7280' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

interface AnnotationFormProps {
  onSubmit: (data: {
    type: AnnotationType;
    priority: Priority;
    title: string;
    description: string;
  }) => void;
  onCancel: () => void;
  elementContext: ReturnType<typeof getElementContext>;
}

function AnnotationForm({ onSubmit, onCancel, elementContext }: AnnotationFormProps) {
  const [type, setType] = useState<AnnotationType>('bug');
  const [priority, setPriority] = useState<Priority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ type, priority, title: title.trim(), description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ padding: '12px', background: '#1f2937', borderRadius: '8px', fontSize: '12px' }}>
        <div style={{ color: '#9ca3af', marginBottom: '4px' }}>Selected Element</div>
        <code style={{ color: '#60a5fa', wordBreak: 'break-all' }}>
          {elementContext.componentName || elementContext.selector}
        </code>
        {elementContext.filePath && (
          <div style={{ marginTop: '4px', color: '#6b7280', fontSize: '11px' }}>
            {elementContext.filePath}
          </div>
        )}
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: '#d1d5db', fontSize: '13px' }}>
          Type
        </label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              style={{
                padding: '6px 12px',
                background: type === opt.value ? opt.color : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: '#d1d5db', fontSize: '13px' }}>
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#374151',
            color: 'white',
            border: '1px solid #4b5563',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: '#d1d5db', fontSize: '13px' }}>
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the issue"
          autoFocus
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#374151',
            color: 'white',
            border: '1px solid #4b5563',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: '#d1d5db', fontSize: '13px' }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details, expected behavior, steps to reproduce..."
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#374151',
            color: 'white',
            border: '1px solid #4b5563',
            borderRadius: '6px',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '10px',
            background: '#374151',
            color: '#d1d5db',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          style={{
            flex: 1,
            padding: '10px',
            background: title.trim() ? '#3b82f6' : '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: title.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 500,
          }}
        >
          Add Issue
        </button>
      </div>
    </form>
  );
}

function AnnotationCard({ annotation, onDelete, onToggleResolved, linkedIssue }: {
  annotation: Annotation;
  onDelete: () => void;
  onToggleResolved: () => void;
  linkedIssue?: GitHubIssue;
}) {
  const typeOption = TYPE_OPTIONS.find((t) => t.value === annotation.type);

  return (
    <div
      style={{
        padding: '12px',
        background: annotation.resolved ? '#1f2937' : '#374151',
        borderRadius: '8px',
        borderLeft: `3px solid ${typeOption?.color || '#6b7280'}`,
        opacity: annotation.resolved ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, color: annotation.resolved ? '#9ca3af' : 'white', textDecoration: annotation.resolved ? 'line-through' : 'none' }}>
            {annotation.title}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            {typeOption?.label} · {annotation.priority}
          </div>
          {annotation.element.componentName && (
            <code style={{ fontSize: '11px', color: '#60a5fa', display: 'block', marginTop: '4px' }}>
              {annotation.element.componentName}
            </code>
          )}
          {linkedIssue && (
            <a
              href={linkedIssue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '6px',
                padding: '2px 6px',
                background: '#1f2937',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#60a5fa',
                textDecoration: 'none',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              #{linkedIssue.number}
            </a>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={onToggleResolved}
            style={{
              padding: '4px',
              background: 'transparent',
              color: annotation.resolved ? '#10b981' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            title={annotation.resolved ? 'Mark unresolved' : 'Mark resolved'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '4px',
              background: 'transparent',
              color: '#6b7280',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            title="Delete"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function QAFlowPanel() {
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
    exportToClipboard,
  } = useQAFlow();

  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: number; failed: number } | null>(null);
  const [createdIssues, setCreatedIssues] = useState<Map<string, GitHubIssue>>(new Map());

  // Load GitHub config on mount
  useEffect(() => {
    const config = loadGitHubConfig();
    setGithubConfig(config);
  }, []);

  if (!isEnabled || !isPanelOpen) return null;

  const elementContext = selectedElement ? getElementContext(selectedElement) : null;
  const unresolvedAnnotations = annotations.filter((a) => !a.resolved);
  const resolvedAnnotations = annotations.filter((a) => a.resolved);

  const handleSubmit = (data: {
    type: AnnotationType;
    priority: Priority;
    title: string;
    description: string;
  }) => {
    if (!elementContext) return;

    addAnnotation({
      ...data,
      element: elementContext,
      pageUrl: window.location.href,
      resolved: false,
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

      // Track created issues
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
        failed: result.failed.length,
      });
    } catch (error) {
      console.error('[QAFlow] Export failed:', error);
      setExportResult({ success: 0, failed: toExport.length });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSettingsSave = (config: GitHubConfig) => {
    setGithubConfig(config);
  };

  return (
    <>
      <div
        data-qaflow="panel"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '360px',
          maxHeight: 'calc(100vh - 100px)',
          background: '#111827',
          borderRadius: '12px',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
          zIndex: 999999,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: 600 }}>
            QAFlow
          </h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: '6px',
                background: githubConfig ? '#065f46' : '#374151',
                color: githubConfig ? '#6ee7b7' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
              }}
              title={githubConfig ? `Connected: ${githubConfig.owner}/${githubConfig.repo}` : 'Configure GitHub'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </button>
            <button
              onClick={togglePanel}
              style={{
                padding: '6px',
                background: 'transparent',
                color: '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {selectedElement && !showForm && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  padding: '12px',
                  background: '#1f2937',
                  borderRadius: '8px',
                  border: '1px dashed #3b82f6',
                }}
              >
                <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
                  Element selected
                </div>
                <code style={{ color: '#60a5fa', fontSize: '13px' }}>
                  {elementContext?.componentName || elementContext?.selector}
                </code>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '12px',
                    padding: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Add Annotation
                </button>
              </div>
            </div>
          )}

          {showForm && elementContext && (
            <AnnotationForm
              elementContext={elementContext}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                clearSelection();
              }}
            />
          )}

          {!showForm && (
            <>
              {unresolvedAnnotations.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Open Issues ({unresolvedAnnotations.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {unresolvedAnnotations.map((a) => (
                      <AnnotationCard
                        key={a.id}
                        annotation={a}
                        onDelete={() => deleteAnnotation(a.id)}
                        onToggleResolved={() => updateAnnotation(a.id, { resolved: true })}
                        linkedIssue={createdIssues.get(a.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {resolvedAnnotations.length > 0 && (
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Resolved ({resolvedAnnotations.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {resolvedAnnotations.map((a) => (
                      <AnnotationCard
                        key={a.id}
                        annotation={a}
                        onDelete={() => deleteAnnotation(a.id)}
                        onToggleResolved={() => updateAnnotation(a.id, { resolved: false })}
                        linkedIssue={createdIssues.get(a.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {annotations.length === 0 && !selectedElement && (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 16px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
                  <div>Click "Grab Element" to start annotating</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Export Result Toast */}
        {exportResult && (
          <div
            style={{
              padding: '12px 16px',
              background: exportResult.failed === 0 ? '#065f46' : '#7f1d1d',
              color: exportResult.failed === 0 ? '#6ee7b7' : '#fca5a5',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {exportResult.success > 0 && `Created ${exportResult.success} issue${exportResult.success > 1 ? 's' : ''}`}
              {exportResult.failed > 0 && ` · ${exportResult.failed} failed`}
              {exportResult.success === 0 && exportResult.failed === 0 && 'All issues already exported'}
            </span>
            <button
              onClick={() => setExportResult(null)}
              style={{
                padding: '2px',
                background: 'transparent',
                color: 'inherit',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Footer */}
        {annotations.length > 0 && !showForm && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #374151',
              display: 'flex',
              gap: '8px',
            }}
          >
            <button
              onClick={exportToClipboard}
              style={{
                flex: 1,
                padding: '8px',
                background: '#374151',
                color: '#d1d5db',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
              title="Copy for AI coding agent"
            >
              📋 Copy for AI
            </button>
            <button
              onClick={handleExportToGitHub}
              disabled={isExporting}
              style={{
                flex: 1,
                padding: '8px',
                background: githubConfig ? '#3b82f6' : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isExporting ? 'wait' : 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {isExporting ? (
                '...'
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {githubConfig ? 'Create Issues' : 'Connect GitHub'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
        />
      )}
    </>
  );
}
