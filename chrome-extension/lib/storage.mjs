export const DEFAULT_STATE = Object.freeze({
  theme: 'gold',
  lastModule: 'dhcp',
  dhcpDraft: {},
  subnetDraft: {},
  logDraft: {}
});

const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_STATE));

function resolveStorage(storageArea) {
  if (storageArea) return storageArea;
  if (!globalThis.chrome?.storage?.local) throw new Error('chrome.storage.local is unavailable');
  return globalThis.chrome.storage.local;
}

export async function loadState(storageArea) {
  const storage = resolveStorage(storageArea);
  const saved = await storage.get(Object.keys(DEFAULT_STATE));
  return { ...DEFAULT_STATE, ...saved };
}

export async function saveState(patch, storageArea) {
  const storage = resolveStorage(storageArea);
  const safe = {};
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (ALLOWED_KEYS.has(key)) safe[key] = value;
  }
  if (Object.keys(safe).length) await storage.set(safe);
  return safe;
}
