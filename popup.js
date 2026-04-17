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
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url || !tab.url.includes('qieman.com')) {
        statusDot.className = 'status-dot logged-out';
        statusText.textContent = '请先打开且慢网站';
        tokenValue.textContent = '-';
        return;
      }

      // 使用tabs.executeScript读取token
      const results = await chrome.tabs.executeScript(tab.id, {
        code: `({
          token: localStorage.getItem('access_token'),
          phone: localStorage.getItem('phone'),
          userId: localStorage.getItem('userId'),
          nickname: localStorage.getItem('nickname')
        })`
      });

      const data = results[0];

      if (data.token) {
        statusDot.className = 'status-dot logged-in';
        statusText.textContent = `已登录 (${data.nickname || data.phone || '未知用户'})`;
        tokenValue.textContent = data.token;
        copyBtn.disabled = false;
      } else {
        statusDot.className = 'status-dot logged-out';
        statusText.textContent = '未登录或登录已过期';
        tokenValue.textContent = '-';
        copyBtn.disabled = true;
      }
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
