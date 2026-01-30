'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  loadGitHubConfig,
  saveGitHubConfig,
  clearGitHubConfig,
  verifyGitHubToken,
  fetchUserRepos,
  fetchGitHubProjects,
  type GitHubConfig,
} from '../github';

interface SettingsProps {
  onClose: () => void;
  onSave: (config: GitHubConfig) => void;
}

export function Settings({ onClose, onSave }: SettingsProps) {
  const [token, setToken] = useState('');
  const [repoSearch, setRepoSearch] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [repos, setRepos] = useState<{ owner: string; name: string; full_name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string; url: string }[]>([]);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [showRepoList, setShowRepoList] = useState(false);

  // Sort and filter repos
  const filteredRepos = useMemo(() => {
    const sorted = [...repos].sort((a, b) =>
      a.full_name.toLowerCase().localeCompare(b.full_name.toLowerCase())
    );

    if (!repoSearch.trim()) return sorted;

    const search = repoSearch.toLowerCase();
    return sorted.filter(repo =>
      repo.full_name.toLowerCase().includes(search) ||
      repo.name.toLowerCase().includes(search)
    );
  }, [repos, repoSearch]);

  // Load existing config
  useEffect(() => {
    const config = loadGitHubConfig();
    if (config) {
      setToken(config.token);
      setSelectedRepo(`${config.owner}/${config.repo}`);
      setRepoSearch(`${config.owner}/${config.repo}`);
      setSelectedProject(config.projectId || '');
      handleVerifyToken(config.token);
    }
  }, []);

  const handleVerifyToken = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) return;

    setStatus('verifying');
    setError('');

    const result = await verifyGitHubToken(tokenToVerify);

    if (!result.valid) {
      setStatus('error');
      setError(result.error || 'Invalid token');
      return;
    }

    setUsername(result.username || '');
    setStatus('loading');

    const userRepos = await fetchUserRepos(tokenToVerify);
    setRepos(userRepos);

    if (selectedRepo) {
      const [owner] = selectedRepo.split('/');
      const userProjects = await fetchGitHubProjects({ token: tokenToVerify, owner });
      setProjects(userProjects);
    }

    setStatus('success');
  };

  const handleRepoSelect = async (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    setRepoSearch(repoFullName);
    setSelectedProject('');
    setShowRepoList(false);

    if (repoFullName && token) {
      const [owner] = repoFullName.split('/');
      const userProjects = await fetchGitHubProjects({ token, owner });
      setProjects(userProjects);
    }
  };

  const handleSave = () => {
    if (!selectedRepo) {
      setError('Please select a repository');
      return;
    }

    const [owner, repo] = selectedRepo.split('/');
    const config: GitHubConfig = {
      token,
      owner,
      repo,
      projectId: selectedProject || undefined,
    };

    saveGitHubConfig(config);
    onSave(config);
    onClose();
  };

  const handleDisconnect = () => {
    clearGitHubConfig();
    setToken('');
    setSelectedRepo('');
    setRepoSearch('');
    setSelectedProject('');
    setRepos([]);
    setProjects([]);
    setStatus('idle');
    setUsername('');
  };

  return (
    <div
      data-grab-qa="settings"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '420px',
          background: '#111827',
          borderRadius: '12px',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: 600 }}>
            GitHub Integration
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              background: 'transparent',
              color: '#9ca3af',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Token Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#d1d5db', fontSize: '13px' }}>
              Personal Access Token
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: '#1f2937',
                  color: 'white',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              <button
                onClick={() => handleVerifyToken(token)}
                disabled={!token.trim() || status === 'verifying'}
                style={{
                  padding: '10px 16px',
                  background: status === 'success' ? '#10b981' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: token.trim() && status !== 'verifying' ? 'pointer' : 'not-allowed',
                  opacity: token.trim() ? 1 : 0.5,
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {status === 'verifying' ? '...' : status === 'success' ? '✓' : 'Verify'}
              </button>
            </div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
              Need a token?{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,project&description=GrabQA"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#60a5fa' }}
              >
                Create one here
              </a>
              {' '}(needs repo + project scopes)
            </div>
          </div>

          {/* Status */}
          {username && (
            <div
              style={{
                padding: '10px 12px',
                background: '#064e3b',
                borderRadius: '6px',
                color: '#6ee7b7',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Connected as <strong>@{username}</strong>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: '#7f1d1d',
                borderRadius: '6px',
                color: '#fca5a5',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {/* Repo Search Input */}
          {repos.length > 0 && (
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#d1d5db', fontSize: '13px' }}>
                Repository
              </label>
              <input
                type="text"
                value={repoSearch}
                onChange={(e) => {
                  setRepoSearch(e.target.value);
                  setShowRepoList(true);
                  if (e.target.value !== selectedRepo) {
                    setSelectedRepo('');
                  }
                }}
                onFocus={() => setShowRepoList(true)}
                placeholder="Search repositories..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1f2937',
                  color: 'white',
                  border: selectedRepo ? '1px solid #10b981' : '1px solid #374151',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              {selectedRepo && (
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(25%)',
                  color: '#10b981',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}

              {/* Repo Dropdown List */}
              {showRepoList && filteredRepos.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    zIndex: 10,
                  }}
                >
                  {filteredRepos.map((repo) => (
                    <button
                      key={repo.full_name}
                      onClick={() => handleRepoSelect(repo.full_name)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 12px',
                        background: selectedRepo === repo.full_name ? '#374151' : 'transparent',
                        color: 'white',
                        border: 'none',
                        borderBottom: '1px solid #374151',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedRepo !== repo.full_name) {
                          e.currentTarget.style.background = '#2d3748';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedRepo !== repo.full_name) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <span style={{ color: '#9ca3af' }}>{repo.owner}/</span>
                      <span style={{ fontWeight: 500 }}>{repo.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* No results message */}
              {showRepoList && repoSearch && filteredRepos.length === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    padding: '12px',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#9ca3af',
                    fontSize: '13px',
                    textAlign: 'center',
                  }}
                >
                  No repositories matching "{repoSearch}"
                </div>
              )}
            </div>
          )}

          {/* Click outside to close dropdown */}
          {showRepoList && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 5,
              }}
              onClick={() => setShowRepoList(false)}
            />
          )}

          {/* Project Selector (optional) */}
          {projects.length > 0 && (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#d1d5db', fontSize: '13px' }}>
                GitHub Project (optional)
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1f2937',
                  color: 'white',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="">No project (issues only)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                Issues will be automatically added to this project board
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {username ? (
            <button
              onClick={handleDisconnect}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: '#f87171',
                border: '1px solid #7f1d1d',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Disconnect
            </button>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
                background: '#374151',
                color: '#d1d5db',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedRepo}
              style={{
                padding: '10px 16px',
                background: selectedRepo ? '#3b82f6' : '#4b5563',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedRepo ? 'pointer' : 'not-allowed',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
