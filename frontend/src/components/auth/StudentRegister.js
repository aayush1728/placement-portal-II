const StudentRegister = {
  template: `
  <div class="min-vh-100 d-flex align-items-center justify-content-center py-5"
       style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%)">
    <div class="auth-card card p-4 p-md-5 w-100 mx-3" style="max-width:520px">
      <div class="text-center mb-4">
        <i class="bi bi-person-plus-fill text-primary" style="font-size:2rem"></i>
        <h4 class="fw-bold mt-2">Student Registration</h4>
        <p class="text-muted small">Create your placement portal account</p>
      </div>

      <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
      <div v-if="success" class="alert alert-success py-2">{{ success }}</div>

      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Full Name *</label>
          <input v-model="form.full_name" type="text" class="form-control" placeholder="Your full name" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Username *</label>
          <input v-model="form.username" type="text" class="form-control" placeholder="username" />
        </div>
        <div class="col-12">
          <label class="form-label">Email Address *</label>
          <input v-model="form.email" type="email" class="form-control" placeholder="you@college.edu" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Password *</label>
          <input v-model="form.password" type="password" class="form-control" placeholder="Min 8 chars" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Phone</label>
          <input v-model="form.phone" type="tel" class="form-control" placeholder="+91 XXXXXXXXXX" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Branch *</label>
          <select v-model="form.branch" class="form-select">
            <option value="">Select Branch</option>
            <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">CGPA *</label>
          <input v-model="form.cgpa" type="number" min="0" max="10" step="0.01"
                 class="form-control" placeholder="e.g. 8.5" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Year *</label>
          <select v-model="form.year" class="form-select">
            <option value="">Year</option>
            <option value="1">1st</option>
            <option value="2">2nd</option>
            <option value="3">3rd</option>
            <option value="4">4th</option>
          </select>
        </div>
      </div>

      <button class="btn btn-primary w-100 mt-4 py-2 fw-semibold"
              :disabled="loading" @click="register">
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        Create Account
      </button>

      <p class="text-center mt-3 small">
        Already have an account?
        <router-link to="/login">Sign in</router-link>
      </p>
    </div>
  </div>
  `,
  data() {
    return {
      form: { full_name: '', username: '', email: '', password: '',
              phone: '', branch: '', cgpa: '', year: '' },
      loading: false, error: '', success: '',
      branches: ['CSE','ECE','EEE','ME','CE','IT','AI/ML','Data Science','Chemical','Biotechnology','Other'],
    };
  },
  methods: {
    async register() {
      const { full_name, username, email, password, branch, cgpa, year } = this.form;
      if (!full_name || !username || !email || !password || !branch || !cgpa || !year) {
        this.error = 'Please fill in all required fields.'; return;
      }
      if (parseFloat(cgpa) < 0 || parseFloat(cgpa) > 10) {
        this.error = 'CGPA must be between 0 and 10.'; return;
      }
      this.loading = true; this.error = '';
      try {
        await API.registerStudent({ ...this.form, cgpa: parseFloat(this.form.cgpa), year: parseInt(this.form.year) });
        this.success = 'Registration successful! Redirecting to login...';
        setTimeout(() => router.push('/login'), 1800);
      } catch (err) {
        this.error = err.response?.data?.error || 'Registration failed.';
      } finally {
        this.loading = false;
      }
    }
  }
};
