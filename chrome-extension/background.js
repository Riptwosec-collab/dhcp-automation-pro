import { DEFAULT_STATE } from './lib/storage.mjs';

const PRODUCTION_URL = 'https://dhcp-automation-pro.vercel.app/#dhcp';

async function openProductionMissionControl() {
  await chrome.tabs.create({ url: PRODUCTION_URL });
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(Object.keys(DEFAULT_STATE));
  const missing = {};
  for (const [key, value] of Object.entries(DEFAULT_STATE)) {
    if (current[key] === undefined) missing[key] = value;
  }
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
});

chrome.action.onClicked.addListener(() => {
  openProductionMissionControl();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'open-mission-control') return;
  await openProductionMissionControl();
});
