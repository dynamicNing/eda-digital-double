// popup.js - 处理token读取和复制逻辑
document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const tokenValue = document.getElementById('tokenValue');
  const copyBtn = document.getElementById('copyBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const toast = document.getElementById('toast');

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  async function fetchToken() {
    try {
      // 先获取当前tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id || !tab.url || !tab.url.includes('qieman.com')) {
        statusDot.className = 'status-dot logged-out';
        statusText.textContent = '请先打开且慢网站';
        tokenValue.textContent = '-';
        copyBtn.disabled = true;
        return;
      }

      // 通过background service worker转发给content script
      chrome.runtime.sendMessage({
        target: 'content',
        tabId: tab.id,
        data: { action: 'getToken' }
      }, (response) => {
        if (chrome.runtime.lastError) {
          statusDot.className = 'status-dot logged-out';
          statusText.textContent = '请刷新且慢页面后重试';
          tokenValue.textContent = '-';
          copyBtn.disabled = true;
          console.error('[E大数字分身]', chrome.runtime.lastError.message);
          return;
        }

        if (response && response.token) {
          statusDot.className = 'status-dot logged-in';
          statusText.textContent = `已登录 (${response.nickname || response.phone || '未知用户'})`;
          tokenValue.textContent = response.token;
          copyBtn.disabled = false;
        } else {
          statusDot.className = 'status-dot logged-out';
          statusText.textContent = '未登录或登录已过期';
          tokenValue.textContent = '-';
          copyBtn.disabled = true;
        }
      });
    } catch (err) {
      statusDot.className = 'status-dot logged-out';
      statusText.textContent = '读取失败: ' + err.message;
      tokenValue.textContent = '-';
      copyBtn.disabled = true;
      console.error('[E大数字分身]', err);
    }
  }

  copyBtn.addEventListener('click', async () => {
    const token = tokenValue.textContent;
    if (token && token !== '-') {
      await navigator.clipboard.writeText(token);
      showToast('已复制到剪贴板');
    }
  });

  refreshBtn.addEventListener('click', fetchToken);

  // 初始加载
  fetchToken();
});
