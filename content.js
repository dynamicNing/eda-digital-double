// content.js - 采集当前页面中的E大帖子，存入chrome.storage.local
(function() {
  // 尝试点击所有"全文"按钮，展开折叠内容
  function expandAll() {
    const fullTextBtns = document.querySelectorAll('span');
    let expanded = 0;
    fullTextBtns.forEach(el => {
      if (el.textContent === '全文' && el.offsetParent !== null) {
        el.click();
        expanded++;
      }
    });
    return expanded;
  }

  // 提取列表页帖子（/content/community 或类似列表页）
  function extractListPosts() {
    const posts = [];
    const timeNodes = document.querySelectorAll('.time-ip-txt');
    timeNodes.forEach(timeNode => {
      let container = timeNode.closest('[class*="sc-"]');
      if (!container) return;
      
      const nameEl = container.querySelector('.name');
      const authorName = nameEl ? nameEl.textContent.replace(/[\n\r]/g, '').trim() : '';
      const contentEl = container.querySelector('.content-text');
      let content = contentEl ? contentEl.textContent.replace(/[\n\r]/g, '').trim() : '';
      
      if (!authorName.includes('ETF拯救世界')) return;
      if (!content) return;
      
      const timeText = timeNode.textContent.replace(/[\n\r]/g, '').trim();
      
      posts.push({
        author: authorName,
        time: timeText,
        content: content,
        url: window.location.href
      });
    });
    return posts;
  }

  // 提取详情页帖子（/content/content-detail?postId=xxx）
  function extractDetailPost() {
    const posts = [];

    // 找作者名 - 详情页结构
    const authorEl = document.querySelector('.sc-1s3ggli-5');
    const authorName = authorEl ? authorEl.textContent.replace(/[\n\r]/g, '').trim() : '';
    if (!authorName.includes('ETF拯救世界')) return posts;

    // 找正文
    const contentEl = document.querySelector('.sc-1s3ggli-0');
    let content = contentEl ? contentEl.textContent.replace(/[\n\r]/g, '').trim() : '';

    // 找时间
    const timeEl = document.querySelector('.sc-1s3ggli-9');
    const timeText = timeEl ? timeEl.textContent.replace(/[\n\r]/g, '').trim() : '';

    // 备选：如果上面没找到，尝试 .sc-1a2zkp5-0 里的长文本
    if (!content) {
      const altContentEl = document.querySelector('.sc-1a2zkp5-0');
      if (altContentEl) {
        const text = altContentEl.textContent;
        // 过滤掉导航和作者信息，只保留正文
        const lines = text.split('\n').filter(l => l.trim().length > 20);
        content = lines.join('\n').trim();
      }
    }

    if (!content) return posts;

    posts.push({
      author: authorName,
      time: timeText,
      content: content,
      url: window.location.href
    });

    return posts;
  }

  // 提取帖子数据（自动判断页面类型）
  function extractPosts() {
    // 判断是详情页还是列表页
    const isDetailPage = window.location.pathname.includes('content-detail');
    
    if (isDetailPage) {
      return extractDetailPost();
    } else {
      return extractListPosts();
    }
  }

  // 监听来自popup的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'collect') {
      const expanded = expandAll();
      setTimeout(() => {
        const posts = extractPosts();
        chrome.storage.local.get(['qieman_posts'], (data) => {
          const existing = data.qieman_posts || [];
          const all = existing.concat(posts);
          const seen = new Set();
          const deduped = all.filter(p => {
            const key = p.content.substring(0, 50);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          chrome.storage.local.set({ qieman_posts: deduped });
          sendResponse({ collected: posts.length, expanded, total: deduped.length });
        });
      }, expanded > 0 ? 1500 : 500);
      return true;
    }
    
    if (request.action === 'getCount') {
      chrome.storage.local.get(['qieman_posts'], (data) => {
        sendResponse({ count: (data.qieman_posts || []).length });
      });
      return true;
    }
    
    if (request.action === 'export') {
      chrome.storage.local.get(['qieman_posts'], (data) => {
        const posts = data.qieman_posts || [];
        const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eda-posts-' + Date.now() + '.json';
        a.click();
        URL.revokeObjectURL(url);
        sendResponse({ exported: posts.length });
      });
      return true;
    }
    
    if (request.action === 'clear') {
      chrome.storage.local.set({ qieman_posts: [] });
      sendResponse({ cleared: true });
      return true;
    }
  });

  window.__edaCollected__ = 0;
})();
