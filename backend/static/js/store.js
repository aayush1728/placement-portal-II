/**
 * store.js — Vuex store for Placement Portal
 */
const store = Vuex.createStore({
  state: () => ({
    user:    JSON.parse(localStorage.getItem("ppa_user") || "null"),
    token:   localStorage.getItem("ppa_token") || "",
    toasts:  [],
    _toastId: 0,
  }),

  getters: {
    isLoggedIn: s => !!s.token,
    userRole:   s => s.user?.role || "",
    isAdmin:    s => s.user?.role === "admin",
    isCompany:  s => s.user?.role === "company",
    isStudent:  s => s.user?.role === "student",
    displayName: s => s.user?.full_name || s.user?.company_name || s.user?.email || "User",
  },

  mutations: {
    SET_AUTH(state, { user, token }) {
      state.user  = user;
      state.token = token;
      localStorage.setItem("ppa_user",  JSON.stringify(user));
      localStorage.setItem("ppa_token", token);
    },
    CLEAR_AUTH(state) {
      state.user  = null;
      state.token = "";
      localStorage.removeItem("ppa_user");
      localStorage.removeItem("ppa_token");
    },
    UPDATE_USER(state, user) {
      state.user = { ...state.user, ...user };
      localStorage.setItem("ppa_user", JSON.stringify(state.user));
    },
    ADD_TOAST(state, toast) {
      state._toastId++;
      state.toasts.push({ ...toast, id: state._toastId });
    },
    REMOVE_TOAST(state, id) {
      state.toasts = state.toasts.filter(t => t.id !== id);
    },
  },

  actions: {
    async login({ commit }, creds) {
      const data = await Api.login(creds);
      commit("SET_AUTH", { user: data.user, token: data.access_token });
      return data.user;
    },
    logout({ commit }) {
      commit("CLEAR_AUTH");
    },
    toast({ commit }, { message, type = "success", duration = 4000 }) {
      commit("ADD_TOAST", { message, type });
      const id = store.state._toastId;
      setTimeout(() => commit("REMOVE_TOAST", id), duration);
    },
  },
});
