export interface RefreshArtifactHashEntry {
  path: string;
  sha256: string;
}

export function canonicalRefreshArtifactProjection(entries: readonly RefreshArtifactHashEntry[]): string {
  const paths = entries.map((entry) => entry.path);
  if (new Set(paths).size !== paths.length) throw new Error('duplicate canonical artifact path');
  if (entries.some((entry, index) => index > 0 && entry.path <= entries[index - 1].path)) {
    throw new Error('canonical artifact paths must be strictly sorted');
  }
  for (const entry of entries) {
    if (!entry.path || entry.path.startsWith('/') || entry.path.includes('..') || entry.path.includes('\\')) {
      throw new Error(`invalid canonical artifact path: ${entry.path}`);
    }
    if (!/^[0-9a-f]{64}$/.test(entry.sha256)) throw new Error(`invalid canonical artifact SHA-256: ${entry.path}`);
  }
  return entries.map((entry) => `${entry.path}\0${entry.sha256}`).join('\n');
}

export async function fingerprintRefreshArtifact(entries: readonly RefreshArtifactHashEntry[]): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalRefreshArtifactProjection(entries));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
