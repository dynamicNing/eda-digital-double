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

  // 提取帖子数据
  function extractPosts() {
    // 查找所有帖子卡片 - 基于实际DOM结构
    const posts = [];
    
    // 方式1: 查找包含time-ip-txt的父容器（每条动态）
    const timeNodes = document.querySelectorAll('.time-ip-txt');
    timeNodes.forEach(timeNode => {
      // 往上查找帖子容器
      let container = timeNode.closest('[class*="sc-"]');
      if (!container) return;
      
      // 找作者名
      const nameEl = container.querySelector('.name');
      const authorName = nameEl ? nameEl.textContent.replace(/[\n\r]/g, '').trim() : '';
      
      // 找正文（content-text或直接文本）
      const contentEl = container.querySelector('.content-text');
      let content = contentEl ? contentEl.textContent.replace(/[\n\r]/g, '').trim() : '';
      
      // 过滤：只要E大(ETF拯救世界)发的帖
      if (!authorName.includes('ETF拯救世界')) return;
      if (!content) return;
      
      // 时间
      const timeText = timeNode.textContent.replace(/[\n\r]/g, '').trim();
      
      posts.push({
        author: authorName,
        time: timeText,
        content: content,
        url: window.location.href
      });
    });
    
    // 方式2: 备用 - 查找帖子正文容器
    if (posts.length === 0) {
      const contentEls = document.querySelectorAll('.content-text');
      contentEls.forEach(el => {
        const parent = el.closest('[class*="sc-"]');
        if (!parent) return;
        const timeEl = parent.querySelector('.time-ip-txt');
        const nameEl = parent.querySelector('.name');
        const authorName = nameEl ? nameEl.textContent.replace(/[\n\r]/g, '').trim() : '';
        if (!authorName.includes('ETF拯救世界')) return;
        const content = el.textContent.replace(/[\n\r]/g, '').trim();
        if (!content) return;
        posts.push({
          author: authorName,
          time: timeEl ? timeEl.textContent.replace(/[\n\r]/g, '').trim() : '',
          content: content,
          url: window.location.href
        });
      });
    }
    
    return posts;
  }

  // 监听来自popup的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'collect') {
      // 先展开全文
      const expanded = expandAll();
      // 等待一下让内容渲染
      setTimeout(() => {
        const posts = extractPosts();
        chrome.storage.local.get(['qieman_posts'], (data) => {
          const existing = data.qieman_posts || [];
          // 合并去重
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
