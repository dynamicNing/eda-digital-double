// content.js - 最简单的方案：在页面里直接把token存到chrome.storage.local
(function() {
  const token = localStorage.getItem('access_token');
  if (token) {
    chrome.storage.local.set({ qieman_token: token, qieman_nickname: localStorage.getItem('nickname') || localStorage.getItem('phone') });
    console.log('[E大数字分身] token已同步');
  }
})();
