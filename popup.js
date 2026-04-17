// popup.js - 使用chrome.cookies API读取access_token (存在于cookie而非localStorage)
document.addEventListener('DOMContentLoaded', () => {
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

  function parseJWT(token) {
    try {
      const parts = token.split('.');
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  function formatTime(ts) {
    return new Date(ts * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  }

  function render(data) {
    if (data && data.token) {
      const payload = parseJWT(data.token);
      const expStr = payload ? `，有效期至 ${formatTime(payload.exp)}` : '';
      statusDot.className = 'status-dot logged-in';
      statusText.textContent = `已登录 (UID: ${payload?.sub || '未知'})${expStr}`;
      tokenValue.textContent = data.token;
      copyBtn.disabled = false;
    } else {
      statusDot.className = 'status-dot logged-out';
      statusText.textContent = '未登录，或cookie无效';
      tokenValue.textContent = '-';
      copyBtn.disabled = true;
    }
  }

  function fetchToken() {
    // 从cookie读取access_token
    chrome.cookies.get({ url: 'https://qieman.com', name: 'access_token' }, (cookie) => {
      if (chrome.runtime.lastError) {
        statusDot.className = 'status-dot logged-out';
        statusText.textContent = '读取cookie失败: ' + chrome.runtime.lastError.message;
        tokenValue.textContent = '-';
        copyBtn.disabled = true;
        return;
      }
      render({ token: cookie?.value });
    });
  }

  copyBtn.addEventListener('click', async () => {
    const token = tokenValue.textContent;
    if (token && token !== '-') {
      await navigator.clipboard.writeText(token);
      showToast('已复制到剪贴板');
    }
  });

  refreshBtn.addEventListener('click', fetchToken);

  fetchToken();
});
