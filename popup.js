// popup.js - 采集帖子 + MD导出逻辑
document.addEventListener('DOMContentLoaded', () => {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const countNum = document.getElementById('countNum');
  const collectBtn = document.getElementById('collectBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportMdBtn = document.getElementById('exportMdBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const clearBtn = document.getElementById('clearBtn');
  const toast = document.getElementById('toast');

  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function updateCount() {
    chrome.storage.local.get(['qieman_posts'], (data) => {
      countNum.textContent = (data.qieman_posts || []).length;
    });
  }

  function renderStatus(isOnPage) {
    if (!isOnPage) {
      statusDot.className = 'status-dot idle';
      statusText.textContent = '请在长赢同路人页面使用';
      collectBtn.disabled = true;
    } else {
      statusDot.className = 'status-dot logged-in';
      statusText.textContent = '页面已就绪';
      collectBtn.disabled = false;
    }
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || '';
    renderStatus(url.includes('qieman.com'));
    updateCount();
  });

  // 采集按钮
  collectBtn.addEventListener('click', () => {
    collectBtn.disabled = true;
    collectBtn.textContent = '采集中...';
    statusDot.className = 'status-dot logged-in';
    statusText.textContent = '正在采集...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        // 向 content.js 发消息，让它处理采集
        func: (tabId) => {
          return new Promise((resolve) => {
            chrome.tabs.sendMessage(tabId, { action: 'collect' }, (response) => {
              resolve(response || { collected: 0, expanded: 0, total: 0 });
            });
          });
        },
        args: [tabs[0].id]
      }, (results) => {
        collectBtn.disabled = false;
        collectBtn.textContent = '📥 采集本页';
        if (chrome.runtime.lastError) {
          statusText.textContent = '采集失败';
          showToast(chrome.runtime.lastError.message, true);
          return;
        }
        const r = results[0].result;
        countNum.textContent = r.total;
        statusText.textContent = `已采集 ${r.collected} 条`;
        showToast(`✅ 本页 ${r.collected} 条，共 ${r.total} 条`);
      });
    });
  });

  // 导出JSON
  exportJsonBtn.addEventListener('click', () => {
    chrome.storage.local.get(['qieman_posts'], (data) => {
      const posts = data.qieman_posts || [];
      const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'eda-posts-' + Date.now() + '.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast(`已导出 ${posts.length} 条JSON`);
    });
  });

  // 导出MD（下载到 ~/Downloads/eda-posts/）
  exportMdBtn.addEventListener('click', () => {
    chrome.storage.local.get(['qieman_posts'], (data) => {
      const posts = data.qieman_posts || [];
      if (posts.length === 0) {
        showToast('没有数据可导出', true);
        return;
      }

      // 生成MD内容
      const mdLines = [
        '# E大（ETF拯救世界）长赢同路人帖子',
        '',
        `> 自动采集 · 共 ${posts.length} 条 · ${new Date().toLocaleString('zh-CN')}`,
        '',
        '---',
        ''
      ];

      posts.forEach((p, i) => {
        mdLines.push(`## ${i + 1}. ${p.time}`);
        mdLines.push('');
        mdLines.push(p.content);
        mdLines.push('');
        mdLines.push(`- 来源: ${p.url}`);
        mdLines.push('---');
        mdLines.push('');
      });

      const mdContent = mdLines.join('\n');
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // 下载到 ~/Downloads/eda-posts/ 文件夹
      a.download = `eda-posts-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`已导出 ${posts.length} 条MD`);
    });
  });

  refreshBtn.addEventListener('click', updateCount);

  clearBtn.addEventListener('click', () => {
    if (confirm('确定清空所有已采集数据？')) {
      chrome.storage.local.set({ qieman_posts: [] });
      countNum.textContent = '0';
      showToast('已清空');
    }
  });
});
