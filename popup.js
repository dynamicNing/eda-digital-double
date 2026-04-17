// popup.js - 使用chrome.scripting.executeScript (MV3正确API)
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

      if (!tab.id || !tab.url || !tab.url.includes('qieman.com')) {
        statusDot.className = 'status-dot logged-out';
        statusText.textContent = '请先打开且慢网站';
        tokenValue.textContent = '-';
        copyBtn.disabled = true;
        return;
      }

      // MV3正确API: chrome.scripting.executeScript
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            token: localStorage.getItem('access_token'),
            nickname: localStorage.getItem('nickname') || localStorage.getItem('phone')
          };
        }
      });

      const data = results[0].result;

      if (data && data.token) {
        // 存一份到storage
        chrome.storage.local.set({ qieman_token: data.token, qieman_nickname: data.nickname });
        statusDot.className = 'status-dot logged-in';
        statusText.textContent = `已登录 (${data.nickname || '未知'})`;
        tokenValue.textContent = data.token;
        copyBtn.disabled = false;
      } else {
        statusDot.className = 'status-dot logged-out';
        statusText.textContent = '未登录，或token为空';
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

  fetchToken();
});
