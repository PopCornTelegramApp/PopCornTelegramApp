const TelegramApp = {
  _ready: false,

  init() {
    try {
      if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        this._ready = true;
      }
    } catch (e) {
      console.warn('Telegram WebApp not available, running in browser mode');
    }
  },

  getInitData() {
    try {
      if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) {
        return Telegram.WebApp.initData;
      }
    } catch (e) {}
    const params = new URLSearchParams(window.location.search);
    const tgParam = params.get('tgWebAppData') || params.get('initData');
    if (tgParam) return tgParam;
    const hash = window.location.hash.substr(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const tgHash = hashParams.get('tgWebAppData') || hashParams.get('initData');
      if (tgHash) return tgHash;
    }
    return 'mock_init_data_for_dev';
  },

  getUser() {
    try {
      if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
        return Telegram.WebApp.initDataUnsafe.user;
      }
    } catch (e) {}
    const mockUser = localStorage.getItem('tg_mock_user');
    if (mockUser) return JSON.parse(mockUser);
    return { id: 0, first_name: 'مستخدم', username: 'user' };
  },

  showAlert(msg) {
    try {
      if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.showAlert(msg);
        return;
      }
    } catch (e) {}
    alert(msg);
  },

  showPopup(title, msg) {
    try {
      if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.showPopup({ title, message: msg, buttons: [{ type: 'close' }] });
        return;
      }
    } catch (e) {}
    alert(`${title}: ${msg}`);
  },

  close() {
    try {
      if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.close();
        return;
      }
    } catch (e) {}
    window.close();
  },

  isDark() {
    try {
      if (window.Telegram && Telegram.WebApp) {
        return Telegram.WebApp.colorScheme === 'dark';
      }
    } catch (e) {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  getThemeParams() {
    try {
      if (window.Telegram && Telegram.WebApp && Telegram.WebApp.themeParams) {
        return Telegram.WebApp.themeParams;
      }
    } catch (e) {}
    return {};
  },

  applyTheme() {
    if (this.isDark()) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  },
};
