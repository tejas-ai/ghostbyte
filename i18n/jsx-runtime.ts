import { Fragment, jsx as reactJsx, jsxs as reactJsxs } from 'react/jsx-runtime';
import { translateVisible } from './runtime';

export { Fragment } from 'react/jsx-runtime';
export type { JSX } from 'react/jsx-runtime';

function translateChildren(children: unknown): unknown {
  if (typeof children === 'string') return translateVisible(children);
  if (Array.isArray(children)) return children.map(translateChildren);
  return children;
}

function localizeProps(type: unknown, props: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!props || (typeof type !== 'string' && type !== Fragment) || props['data-no-translate']) return props;
  const next = { ...props };
  if ('children' in next) next.children = translateChildren(next.children);
  for (const key of ['placeholder', 'aria-label', 'title', 'alt']) {
    if (typeof next[key] === 'string') next[key] = translateVisible(next[key]);
  }
  return next;
}

export function jsx(type: Parameters<typeof reactJsx>[0], props: Parameters<typeof reactJsx>[1], key?: string) {
  return reactJsx(type, localizeProps(type, props as Record<string, unknown> | null) as typeof props, key);
}

export function jsxs(type: Parameters<typeof reactJsxs>[0], props: Parameters<typeof reactJsxs>[1], key?: string) {
  return reactJsxs(type, localizeProps(type, props as Record<string, unknown> | null) as typeof props, key);
}
