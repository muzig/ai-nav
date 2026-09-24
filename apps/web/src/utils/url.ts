/**
 * 根据当前访问来源解析书签 URL。
 *
 * 规则:
 * - 从局域网访问 (192.168.x.x / 10.x / 172.16-31.x) → 优先用 internal_url
 * - 从 Tailscale / 公网访问 (100.x CGNAT / 域名) → 用 url
 * - internal_url 为空时始终 fallback 到 url
 */

export type AccessMode = 'lan' | 'remote';

export function detectAccessMode(): AccessMode {
  const host = window.location.hostname;

  // 局域网网段
  if (
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === 'localhost' ||
    host === '127.0.0.1'
  ) {
    return 'lan';
  }

  // Tailscale CGNAT 100.64.0.0/10 或任何公网域名
  return 'remote';
}

export function resolveBookmarkUrl(bookmark: { url: string; internal_url?: string }): string {
  const mode = detectAccessMode();
  if (mode === 'lan' && bookmark.internal_url) {
    return bookmark.internal_url;
  }
  return bookmark.url;
}
