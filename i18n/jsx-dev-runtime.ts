import { Fragment, jsxDEV as reactJsxDEV } from 'react/jsx-dev-runtime';
export { Fragment } from 'react/jsx-dev-runtime';
export type { JSX } from 'react/jsx-dev-runtime';
import { translateVisible } from './runtime';

export function jsxDEV(
  type: Parameters<typeof reactJsxDEV>[0],
  props: Parameters<typeof reactJsxDEV>[1],
  key: Parameters<typeof reactJsxDEV>[2],
  isStaticChildren: Parameters<typeof reactJsxDEV>[3],
  source: Parameters<typeof reactJsxDEV>[4],
  self: Parameters<typeof reactJsxDEV>[5],
) {
  if ((typeof type !== 'string' && type !== Fragment) || !props || (props as Record<string, unknown>)['data-no-translate']) {
    return reactJsxDEV(type, props, key, isStaticChildren, source, self);
  }
  const next = { ...(props as Record<string, unknown>) };
  if (typeof next.children === 'string') next.children = translateVisible(next.children);
  else if (Array.isArray(next.children)) next.children = next.children.map((child: unknown) => typeof child === 'string' ? translateVisible(child) : child);
  for (const name of ['placeholder', 'aria-label', 'title', 'alt']) {
    if (typeof next[name] === 'string') next[name] = translateVisible(next[name]);
  }
  return reactJsxDEV(type, next, key, isStaticChildren, source, self);
}
