const LoginPage = {
  template:`
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="text-center mb-4">
          <i class="bi bi-mortarboard-fill fs-1 text-primary"></i>
          <div class="auth-brand mt-1">PlacementPortal</div>
          <p class="text-muted small">Institute Placement Management System</p>
        </div>
        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label fw-semibold">Email Address</label>
            <div class="input-group">
              <span class="input-group-text bg-light"><i class="bi bi-envelope"></i></span>
              <input v-model="form.email" type="email" class="form-control" placeholder="your@email.com" required>
            </div>
          </div>
          <div class="mb-4">
            <label class="form-label fw-semibold">Password</label>
            <div class="input-group">
              <span class="input-group-text bg-light"><i class="bi bi-lock"></i></span>
              <input v-model="form.password" :type="showPwd?'text':'password'" class="form-control" placeholder="••••••••" required>
              <button class="btn btn-outline-secondary" type="button" @click="showPwd=!showPwd">
                <i class="bi" :class="showPwd?'bi-eye-slash':'bi-eye'"></i>
              </button>
            </div>
          </div>
          <div v-if="errMsg" class="alert alert-danger py-2 small">{{ errMsg }}</div>
          <button class="btn w-100 btn-primary-ppa py-2 fw-semibold" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-box-arrow-in-right me-2"></i>Sign In
          </button>
        </form>
        <hr class="my-3">
        <p class="text-center small text-muted mb-0">
          New here?
          <router-link to="/register/student">Student</router-link> /
          <router-link to="/register/company">Company</router-link> registration
        </p>
      </div>
    </div>`,
  data:() => ({ form:{email:"",password:""}, errMsg:"", loading:false, showPwd:false }),
  methods: {
    async submit() {
      this.errMsg=""; this.loading=true;
      try {
        const user = await this.$store.dispatch("login", this.form);
        this.$store.dispatch("toast",{message:"Welcome back!"});
        if(user.role==="admin")   this.$router.push("/admin");
        else if(user.role==="company") this.$router.push("/company");
        else this.$router.push("/student");
      } catch(e) {
        this.errMsg = e.message || "Login failed.";
      } finally { this.loading=false; }
    },
  },
};
