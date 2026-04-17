// content.js - 在且慢页面注入，读取localStorage中的access_token
(function() {
  // 存储token到全局变量，供popup读取
  window.__edaToken__ = localStorage.getItem('access_token');
  window.__edaUserInfo__ = {
    phone: localStorage.getItem('phone'),
    userId: localStorage.getItem('userId'),
    nickname: localStorage.getItem('nickname')
  };

  console.log('[E大数字分身] access_token已提取:', window.__edaToken__ ? '已获取' : '未登录');
})();
