// popup.js - 从chrome.storage.local读取token
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

  function render(data) {
    if (data && data.token) {
      statusDot.className = 'status-dot logged-in';
      statusText.textContent = `已登录 (${data.nickname || '未知用户'})`;
      tokenValue.textContent = data.token;
      copyBtn.disabled = false;
    } else {
      statusDot.className = 'status-dot logged-out';
      statusText.textContent = '未登录，或请先打开且慢任意页面触发采集';
      tokenValue.textContent = '-';
      copyBtn.disabled = true;
    }
  }

  // 从storage读取
  function fetchToken() {
    chrome.storage.local.get(['qieman_token', 'qieman_nickname'], (data) => {
      render({
        token: data.qieman_token,
        nickname: data.qieman_nickname
      });
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
