// Bootstrap the Vue 3 app
store.init();  // Restore auth state from localStorage

const App = {
  template: `
  <div>
    <!-- Authenticated layout: sidebar + content -->
    <div v-if="isLoggedIn" class="d-flex">
      <Navbar />
      <div class="flex-grow-1 overflow-auto" style="min-height:100vh;max-width:calc(100vw - 220px)">
        <router-view />
      </div>
    </div>

    <!-- Unauthenticated: full-page view -->
    <div v-else>
      <router-view />
    </div>

    <!-- Toast notifications -->
    <ToastContainer />
  </div>
  `,
  components: { Navbar, ToastContainer },
  computed: {
    isLoggedIn() { return store.isLoggedIn(); }
  }
};

const vueApp = Vue.createApp(App);
vueApp.use(router);
vueApp.mount('#app');
