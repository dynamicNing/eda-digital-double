// content.js - 在且慢页面注入，响应popup的消息请求
(function() {
  // 读取token
  function getTokenData() {
    return {
      token: localStorage.getItem('access_token'),
      phone: localStorage.getItem('phone'),
      userId: localStorage.getItem('userId'),
      nickname: localStorage.getItem('nickname')
    };
  }

  // 监听popup的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getToken') {
      sendResponse(getTokenData());
    }
    return true;
  });

  // 立即执行一次存储到window
  window.__edaTokenData__ = getTokenData();
  console.log('[E大数字分身] token已就绪');
})();
