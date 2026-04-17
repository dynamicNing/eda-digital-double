// background.js - MV3 Service Worker，作为popup和content script的通信桥梁
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 转发来自popup的请求给content script
  if (request.target === 'content') {
    chrome.tabs.sendMessage(request.tabId, request.data, (response) => {
      sendResponse(response);
    });
    return true; // 异步响应
  }
});
