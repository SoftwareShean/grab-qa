import type { Annotation } from './types';
import { formatGitHubIssueBody, getGitHubLabels } from './export';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  projectId?: string; // GitHub Project ID for board integration
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
}

const STORAGE_KEY = 'qaflow-github-config';

/**
 * Load GitHub config from localStorage
 */
export function loadGitHubConfig(): GitHubConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save GitHub config to localStorage
 */
export function saveGitHubConfig(config: GitHubConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Clear GitHub config
 */
export function clearGitHubConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Detect git remote from common patterns
 * This is a fallback - ideally the build tool provides this
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/,
    /github\.com\/([^/]+)\/([^/]+)\/?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }

  return null;
}

/**
 * Create a GitHub issue via the API
 */
export async function createGitHubIssue(
  config: GitHubConfig,
  annotation: Annotation
): Promise<GitHubIssue> {
  const body = formatGitHubIssueBody(annotation);
  const labels = getGitHubLabels(annotation);

  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[QA] ${annotation.title}`,
        body,
        labels,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Create multiple issues and return results
 */
export async function createGitHubIssues(
  config: GitHubConfig,
  annotations: Annotation[]
): Promise<{ success: GitHubIssue[]; failed: { annotation: Annotation; error: string }[] }> {
  const success: GitHubIssue[] = [];
  const failed: { annotation: Annotation; error: string }[] = [];

  for (const annotation of annotations) {
    try {
      const issue = await createGitHubIssue(config, annotation);
      success.push(issue);
    } catch (error) {
      failed.push({
        annotation,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { success, failed };
}

/**
 * Add an issue to a GitHub Project (v2)
 */
export async function addIssueToProject(
  config: GitHubConfig,
  issueId: string
): Promise<void> {
  if (!config.projectId) return;

  // GitHub Projects v2 uses GraphQL
  const query = `
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item {
          id
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        projectId: config.projectId,
        contentId: issueId,
      },
    }),
  });

  if (!response.ok) {
    console.warn('[QAFlow] Failed to add issue to project');
  }
}

/**
 * Fetch user's GitHub Projects
 */
export async function fetchGitHubProjects(
  config: Pick<GitHubConfig, 'token' | 'owner'>
): Promise<{ id: string; title: string; url: string }[]> {
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

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { owner: config.owner },
    }),
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const userProjects = data.data?.user?.projectsV2?.nodes || [];
  const orgProjects = data.data?.organization?.projectsV2?.nodes || [];

  return [...userProjects, ...orgProjects].filter(Boolean);
}

/**
 * Verify GitHub token has required permissions
 */
export async function verifyGitHubToken(token: string): Promise<{
  valid: boolean;
  username?: string;
  scopes?: string[];
  error?: string;
}> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return { valid: false, error: 'Invalid token' };
    }

    const user = await response.json();
    const scopes = response.headers.get('x-oauth-scopes')?.split(', ') || [];

    return {
      valid: true,
      username: user.login,
      scopes,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Fetch repos the user has access to
 */
export async function fetchUserRepos(
  token: string
): Promise<{ owner: string; name: string; full_name: string }[]> {
  const response = await fetch(
    'https://api.github.com/user/repos?sort=pushed&per_page=50',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) return [];

  const repos = await response.json();
  return repos.map((r: { owner: { login: string }; name: string; full_name: string }) => ({
    owner: r.owner.login,
    name: r.name,
    full_name: r.full_name,
  }));
}
