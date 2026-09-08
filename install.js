export function setupInstall({openDialog, showToast}) {
  let pendingPrompt = null;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const button = document.createElement('button');
  button.className = 'tool-button install-button';
  button.setAttribute('aria-label', '添加到桌面');
  button.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8m-4-4v4m0-14v6m-3-3 3 3 3-3"/></svg><span>添加到桌面</span>';
  button.hidden = standalone();
  document.querySelector('.top-actions').append(button);

  const instructions = () => {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const android = /Android/.test(ua);
    const mac = /Macintosh/.test(ua) && !ios;
    if (ios) return '<h3>iPhone / iPad</h3><p>在 Safari 中打开此页，点“分享”，选择“添加到主屏幕”，再点“添加”。</p>';
    if (android) return '<h3>Android</h3><p>在 Chrome 中打开此页，从右上角菜单选择“添加到主屏幕”或“安装应用”。</p>';
    if (mac) return '<h3>Mac</h3><p>Safari：菜单栏“文件” → “添加到程序坞”。</p><p>Chrome / Edge：点击地址栏的安装图标，或在浏览器菜单中选择安装此网页。</p>';
    return '<h3>电脑</h3><p>在 Chrome 或 Edge 中打开此页，点击地址栏的安装图标；也可以从浏览器菜单中选择安装此网页。</p>';
  };
  const showInstall = () => {
    openDialog('MOONVEIL · 随时开启', `<div class="install-heading"><img src="./icons/icon-192.png" alt="月隐塔罗图标" width="72" height="72"><div><h2>把月隐塔罗放在桌面</h2><p>下次点击月亮图标，就能直接打开。</p></div></div>${pendingPrompt ? '<button class="primary-button" id="installNow">安装月隐塔罗</button>' : ''}<div class="install-guide">${instructions()}</div><p class="install-note">安装完成后，会以独立窗口打开。</p>`, 'install-dialog');
    document.querySelector('#installNow')?.addEventListener('click', async () => {
      const prompt = pendingPrompt;
      if (!prompt) return;
      pendingPrompt = null;
      document.querySelector('#mainDialog').close();
      try {
        await prompt.prompt();
        const {outcome} = await prompt.userChoice;
        if (outcome !== 'accepted') showToast('随时可以再次添加到桌面。');
      } catch {
        showInstall();
      }
    });
  };
  button.addEventListener('click', showInstall);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pendingPrompt = event;
  });
  window.addEventListener('appinstalled', () => {
    pendingPrompt = null;
    button.hidden = true;
    if (document.querySelector('#mainDialog').classList.contains('install-dialog')) document.querySelector('#mainDialog').close();
    showToast('月隐塔罗已添加，点击月亮图标即可打开。');
  });
  if ('serviceWorker' in navigator && window.isSecureContext) {
    const register = () => navigator.serviceWorker.register(new URL('./sw.js', import.meta.url), {scope:'./'}).catch(error => console.warn('桌面缓存暂未启用', error));
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, {once:true});
  }
}
