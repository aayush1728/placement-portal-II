// Global reactive store using Vue 3 reactivity
const store = Vue.reactive({
  user: null,
  profile: null,
  token: null,
  toasts: [],

  init() {
    const saved = localStorage.getItem('ppa_token');
    const savedUser = localStorage.getItem('ppa_user');
    if (saved && savedUser) {
      this.token = saved;
      this.user = JSON.parse(savedUser);
      this.profile = JSON.parse(localStorage.getItem('ppa_profile') || 'null');
    }
  },

  login(token, user, profile) {
    this.token = token;
    this.user = user;
    this.profile = profile;
    localStorage.setItem('ppa_token', token);
    localStorage.setItem('ppa_user', JSON.stringify(user));
    localStorage.setItem('ppa_profile', JSON.stringify(profile));
  },

  logout() {
    this.token = null;
    this.user = null;
    this.profile = null;
    localStorage.removeItem('ppa_token');
    localStorage.removeItem('ppa_user');
    localStorage.removeItem('ppa_profile');
  },

  isLoggedIn() {
    return !!this.token && !!this.user;
  },

  role() {
    return this.user ? this.user.role : null;
  },

  addToast(message, type = 'success') {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), 4000);
  },

  removeToast(id) {
    const idx = this.toasts.findIndex(t => t.id === id);
    if (idx !== -1) this.toasts.splice(idx, 1);
  },
});
