import type { ElementContext } from './types';

/**
 * Get a unique CSS selector for an element
 */
export function getSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).slice(0, 2);
      if (classes.length > 0 && classes[0]) {
        selector += `.${classes.join('.')}`;
      }
    }

    const parentEl: Element | null = current.parentElement;
    if (parentEl) {
      const currentTagName = current.tagName;
      const siblings = Array.from(parentEl.children).filter(
        (child: Element) => child.tagName === currentTagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = parentEl;
  }

  return path.join(' > ');
}

/**
 * Try to get React component info from fiber
 */
function getReactInfo(element: HTMLElement): { componentName?: string; filePath?: string } {
  const fiberKey = Object.keys(element).find(
    (key) => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
  );

  if (!fiberKey) return {};

  try {
    const fiber = (element as unknown as Record<string, unknown>)[fiberKey] as Record<string, unknown>;
    let current = fiber;
    let componentName: string | undefined;

    // Traverse up the fiber tree to find a function/class component
    while (current) {
      const type = current.type as Record<string, unknown> | string | undefined;
      if (type && typeof type === 'function') {
        componentName = (type as { displayName?: string; name?: string }).displayName ||
          (type as { name?: string }).name;
        if (componentName && !componentName.startsWith('_')) {
          break;
        }
      }
      current = current.return as Record<string, unknown>;
    }

    // Try to get source info from _debugSource (dev only)
    let filePath: string | undefined;
    if (fiber._debugSource) {
      const source = fiber._debugSource as { fileName?: string; lineNumber?: number };
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

/**
 * Extract full context from a DOM element
 */
export function getElementContext(element: HTMLElement): ElementContext {
  const reactInfo = getReactInfo(element);

  return {
    selector: getSelector(element),
    tagName: element.tagName.toLowerCase(),
    className: element.className || '',
    id: element.id || '',
    textContent: (element.textContent || '').slice(0, 200).trim(),
    innerHTML: element.innerHTML.slice(0, 500),
    boundingRect: element.getBoundingClientRect(),
    componentName: reactInfo.componentName,
    filePath: reactInfo.filePath,
  };
}

/**
 * Highlight an element with an overlay
 */
export function createHighlight(element: HTMLElement): HTMLDivElement {
  const rect = element.getBoundingClientRect();
  const highlight = document.createElement('div');

  highlight.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background: rgba(59, 130, 246, 0.2);
    border: 2px solid rgb(59, 130, 246);
    border-radius: 4px;
    pointer-events: none;
    z-index: 999998;
    transition: all 0.1s ease;
  `;

  return highlight;
}

/**
 * Check if element is part of QAFlow UI
 */
export function isQAFlowElement(element: HTMLElement): boolean {
  return element.closest('[data-qaflow]') !== null;
}
