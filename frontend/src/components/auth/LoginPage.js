const LoginPage = {
  template: `
  <div class="min-vh-100 d-flex align-items-center justify-content-center"
       style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%)">
    <div class="auth-card card p-4 p-md-5 w-100 mx-3">
      <div class="text-center mb-4">
        <i class="bi bi-mortarboard-fill text-primary" style="font-size:2.5rem"></i>
        <div class="auth-brand mt-1">Placement Portal</div>
        <p class="text-muted small">Institute Recruitment Management System</p>
      </div>

      <div v-if="error" class="alert alert-danger alert-dismissible py-2">
        {{ error }}
        <button type="button" class="btn-close" @click="error=''"></button>
      </div>

      <div class="mb-3">
        <label class="form-label fw-semibold">Email Address</label>
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-envelope"></i></span>
          <input v-model="email" type="email" class="form-control"
                 placeholder="you@example.com" @keyup.enter="login" />
        </div>
      </div>

      <div class="mb-4">
        <label class="form-label fw-semibold">Password</label>
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-lock"></i></span>
          <input v-model="password" :type="showPwd ? 'text' : 'password'"
                 class="form-control" placeholder="••••••••" @keyup.enter="login" />
          <button class="btn btn-outline-secondary" type="button" @click="showPwd=!showPwd">
            <i :class="showPwd ? 'bi-eye-slash' : 'bi-eye'" class="bi"></i>
          </button>
        </div>
      </div>

      <button class="btn btn-primary w-100 py-2 fw-semibold" :disabled="loading" @click="login">
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        Sign In
      </button>

      <hr class="my-4">
      <p class="text-center text-muted small mb-2">New to the portal?</p>
      <div class="d-flex gap-2">
        <router-link to="/register/student" class="btn btn-outline-primary flex-fill">
          <i class="bi bi-person-plus me-1"></i>Student
        </router-link>
        <router-link to="/register/company" class="btn btn-outline-secondary flex-fill">
          <i class="bi bi-building me-1"></i>Company
        </router-link>
      </div>
    </div>
  </div>
  `,
  data() {
    return { email: '', password: '', loading: false, error: '', showPwd: false };
  },
  methods: {
    async login() {
      if (!this.email || !this.password) {
        this.error = 'Please enter email and password.';
        return;
      }
      this.loading = true;
      this.error = '';
      try {
        const res = await API.login({ email: this.email, password: this.password });
        const { access_token, user, profile } = res.data;
        store.login(access_token, user, profile);
        store.addToast(`Welcome back, ${user.username}!`);
        const dest = { admin: '/admin', company: '/company', student: '/student' }[user.role] || '/login';
        router.push(dest);
      } catch (err) {
        this.error = err.response?.data?.error || 'Login failed. Please try again.';
      } finally {
        this.loading = false;
      }
    }
  }
};
