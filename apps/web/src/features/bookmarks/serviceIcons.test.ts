import { describe, expect, it } from 'vitest';
import { resolveLocalServiceIcon } from './serviceIcons';

describe('resolveLocalServiceIcon', () => {
  it.each([
    ['Gitea: Git with a cup of tea', 'http://100.64.0.10:3000/', 'gitea'],
    ['Grafana', 'http://100.64.0.10:3010/login', 'grafana'],
    ['Cloudreve', 'http://100.64.0.10:40033/login', 'cloudreve'],
    ['All gists - Opengist', 'http://100.64.0.10:6157/all', 'opengist'],
    ['Home\n· TeslaMate', 'http://192.168.1.10:4000/', 'teslamate'],
  ])('maps %s by its service name', (title, url, expected) => {
    expect(resolveLocalServiceIcon({ title, url })?.id).toBe(expected);
  });

  it('uses the well-known local port when Immich metadata has no useful title', () => {
    expect(resolveLocalServiceIcon({
      title: '100.64.0.10',
      url: 'http://100.64.0.10:2283/auth/login',
    })?.id).toBe('immich');
  });

  it('does not map unknown local services or public bookmarks', () => {
    expect(resolveLocalServiceIcon({
      title: 'Content Studio',
      url: 'http://100.64.0.10:3000/',
    })).toBeNull();
    expect(resolveLocalServiceIcon({
      title: 'Grafana',
      url: 'https://grafana.com/',
    })).toBeNull();
  });
});
