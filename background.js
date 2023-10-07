// { [tabId]: TabState } tabs - a hash of tab states keyed by tab id
// where TabState is an object with the following properties:
// - scriptInjected {boolean|undefined}
// - badgeText {string|undefined}
let tabs = {};
let activeTabId = null;

function setActiveTab(tabId) {
  if (!tabs[tabId]) {
    tabs[tabId] = {};
  }
  activeTabId = tabId;
  updateBadge();
}

function resetTabState(tabId) {
  tabs[tabId] = {};
  updateBadge();
}

function updateTabState(tabId, tabState) {
  tabs[tabId] = { ...tabs[tabId], ...tabState };
  updateBadge();
}

function updateBadge() {
  const activeTab = tabs[activeTabId];
  chrome.action.setBadgeText({
    text: activeTab?.scriptInjected ? activeTab.badgeText : "",
  });
}

// updates the currently active tab
chrome.tabs.onActivated.addListener(({ tabId }) => {
  setActiveTab(tabId);
});

// resets the tab state when the tab is reloaded
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    resetTabState(tabId);
  }
});

// the content script sends an update to the badge text
chrome.runtime.onMessage.addListener((request, sender) => {
  const tabId = sender.tab?.id;
  if (!tabId || !tabs[tabId]) {
    console.log("unknown message sender", sender.tab);
    return;
  }
  updateTabState(tabId, {
    badgeText: request.badgeText,
  });
});

// depending on the current tab state, either starts or stops the recording
chrome.action.onClicked.addListener(async (tab) => {
  const tabState = tabs[tab.id];
  if (!tabState) {
    resetTabState(tab.id);
  }

  if (!tabState.scriptInjected) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["fix-webm-duration.js", "content-script.js"],
    });
    updateTabState(tab.id, { scriptInjected: true });
  } else {
    await chrome.tabs.sendMessage(tab.id, { op: "stop-recording" });
  }
});
