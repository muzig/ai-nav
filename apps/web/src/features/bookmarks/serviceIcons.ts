import cloudreveIcon from '../../assets/service-icons/cloudreve.svg';
import giteaIcon from '../../assets/service-icons/gitea.svg';
import grafanaIcon from '../../assets/service-icons/grafana.svg';
import immichIcon from '../../assets/service-icons/immich.svg';
import opengistIcon from '../../assets/service-icons/opengist.svg';
import teslamateIcon from '../../assets/service-icons/teslamate.svg';
import { isLocalServiceUrl } from './selectors';

export type LocalServiceIconId =
  | 'cloudreve'
  | 'gitea'
  | 'grafana'
  | 'immich'
  | 'opengist'
  | 'teslamate';

export interface LocalServiceIcon {
  id: LocalServiceIconId;
  label: string;
  src: string;
}

const icons: Record<LocalServiceIconId, LocalServiceIcon> = {
  cloudreve: { id: 'cloudreve', label: 'Cloudreve', src: cloudreveIcon },
  gitea: { id: 'gitea', label: 'Gitea', src: giteaIcon },
  grafana: { id: 'grafana', label: 'Grafana', src: grafanaIcon },
  immich: { id: 'immich', label: 'Immich', src: immichIcon },
  opengist: { id: 'opengist', label: 'Opengist', src: opengistIcon },
  teslamate: { id: 'teslamate', label: 'TeslaMate', src: teslamateIcon },
};

const titleMatchers: Array<[LocalServiceIconId, RegExp]> = [
  ['cloudreve', /\bcloudreve\b/],
  ['gitea', /\bgitea\b/],
  ['grafana', /\bgrafana\b/],
  ['immich', /\bimmich\b/],
  ['opengist', /\bopengist\b/],
  ['teslamate', /\bteslamate\b/],
];

function normalizedTitle(title: string): string {
  return title.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Resolve only known local services. Public bookmarks keep using their own
 * favicon, while unknown local tools retain the generic service fallback.
 */
export function resolveLocalServiceIcon(
  bookmark: { title: string; url: string },
): LocalServiceIcon | null {
  if (!isLocalServiceUrl(bookmark.url)) return null;

  const title = normalizedTitle(bookmark.title);
  for (const [id, matcher] of titleMatchers) {
    if (matcher.test(title)) return icons[id];
  }

  try {
    // Immich's default port is distinctive enough to identify records whose
    // imported metadata contains only an IP address.
    if (new URL(bookmark.url).port === '2283') return icons.immich;
  } catch {
    // isLocalServiceUrl already rejects malformed URLs; keep this function total.
  }

  return null;
}
