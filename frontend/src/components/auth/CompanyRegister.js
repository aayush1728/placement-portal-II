const CompanyRegister = {
  template: `
  <div class="min-vh-100 d-flex align-items-center justify-content-center py-5"
       style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%)">
    <div class="auth-card card p-4 p-md-5 w-100 mx-3" style="max-width:520px">
      <div class="text-center mb-4">
        <i class="bi bi-building-fill text-primary" style="font-size:2rem"></i>
        <h4 class="fw-bold mt-2">Company Registration</h4>
        <p class="text-muted small">Your profile will be reviewed by the placement cell</p>
      </div>

      <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
      <div v-if="success" class="alert alert-success py-2">{{ success }}</div>

      <div class="row g-3">
        <div class="col-12">
          <label class="form-label">Company Name *</label>
          <input v-model="form.company_name" type="text" class="form-control" placeholder="Acme Corp" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Username *</label>
          <input v-model="form.username" type="text" class="form-control" placeholder="acmecorp_hr" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Industry</label>
          <select v-model="form.industry" class="form-select">
            <option value="">Select</option>
            <option v-for="ind in industries" :key="ind" :value="ind">{{ ind }}</option>
          </select>
        </div>
        <div class="col-12">
          <label class="form-label">Official Email *</label>
          <input v-model="form.email" type="email" class="form-control" placeholder="hr@company.com" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Password *</label>
          <input v-model="form.password" type="password" class="form-control" placeholder="••••••••" />
        </div>
        <div class="col-md-6">
          <label class="form-label">HR Contact Name</label>
          <input v-model="form.hr_name" type="text" class="form-control" placeholder="John Doe" />
        </div>
        <div class="col-md-6">
          <label class="form-label">HR Email</label>
          <input v-model="form.hr_email" type="email" class="form-control" placeholder="hr@company.com" />
        </div>
        <div class="col-md-6">
          <label class="form-label">HR Phone</label>
          <input v-model="form.hr_phone" type="tel" class="form-control" placeholder="+91 XXXXXXXXXX" />
        </div>
        <div class="col-12">
          <label class="form-label">Website</label>
          <input v-model="form.website" type="url" class="form-control" placeholder="https://company.com" />
        </div>
        <div class="col-12">
          <label class="form-label">Company Description</label>
          <textarea v-model="form.description" class="form-control" rows="3"
                    placeholder="Brief about your company..."></textarea>
        </div>
      </div>

      <button class="btn btn-primary w-100 mt-4 py-2 fw-semibold"
              :disabled="loading" @click="register">
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        Submit for Approval
      </button>
      <p class="text-center mt-3 small">
        Already registered? <router-link to="/login">Sign in</router-link>
      </p>
    </div>
  </div>
  `,
  data() {
    return {
      form: { company_name: '', username: '', email: '', password: '',
              hr_name: '', hr_email: '', hr_phone: '', website: '', description: '', industry: '' },
      loading: false, error: '', success: '',
      industries: ['IT/Software','Finance','Consulting','Manufacturing','Healthcare',
                   'E-Commerce','Telecom','Automobile','FMCG','Media','Other'],
    };
  },
  methods: {
    async register() {
      const { company_name, username, email, password } = this.form;
      if (!company_name || !username || !email || !password) {
        this.error = 'Please fill all required fields.'; return;
      }
      this.loading = true; this.error = '';
      try {
        await API.registerCompany(this.form);
        this.success = 'Registration submitted! Admin will review and approve your profile.';
        setTimeout(() => router.push('/login'), 2500);
      } catch (err) {
        this.error = err.response?.data?.error || 'Registration failed.';
      } finally {
        this.loading = false;
      }
    }
  }
};
