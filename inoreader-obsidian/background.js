chrome.action.onClicked.addListener(async tab => {
  await chrome.storage.session.set({sourceTabId: tab.id});
  await chrome.tabs.create({url: chrome.runtime.getURL('app.html')});
});
