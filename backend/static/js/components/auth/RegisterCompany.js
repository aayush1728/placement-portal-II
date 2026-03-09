const RegisterCompany = {
  template:`
    <div class="auth-wrapper">
      <div class="auth-card" style="max-width:520px">
        <div class="text-center mb-3">
          <i class="bi bi-building-add fs-2 text-primary"></i>
          <h4 class="fw-bold mt-1">Company Registration</h4>
          <p class="text-muted small">Your account will be reviewed by the admin before activation.</p>
        </div>
        <form @submit.prevent="submit">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label fw-semibold">Company Name *</label>
              <input v-model="f.company_name" class="form-control" required placeholder="Acme Technologies Pvt Ltd">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Login Email *</label>
              <input v-model="f.email" type="email" class="form-control" required placeholder="hr@company.com">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Password *</label>
              <input v-model="f.password" type="password" class="form-control" required minlength="6" placeholder="Min 6 chars">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">HR Contact Person</label>
              <input v-model="f.hr_name" class="form-control" placeholder="Priya Verma">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">HR Phone/Email</label>
              <input v-model="f.hr_contact" class="form-control" placeholder="+91 9876543210">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Industry</label>
              <select v-model="f.industry" class="form-select">
                <option value="">Select industry</option>
                <option>Information Technology</option><option>Finance & Banking</option>
                <option>Consulting</option><option>E-Commerce</option>
                <option>Manufacturing</option><option>Healthcare</option><option>Education</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Headquarters</label>
              <input v-model="f.headquarters" class="form-control" placeholder="Bengaluru, India">
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">Website</label>
              <input v-model="f.website" class="form-control" placeholder="https://company.com">
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">About Company</label>
              <textarea v-model="f.description" class="form-control" rows="3" placeholder="Brief description of your company..."></textarea>
            </div>
          </div>
          <div v-if="errMsg" class="alert alert-danger py-2 small mt-3">{{ errMsg }}</div>
          <button class="btn btn-primary-ppa w-100 mt-3 py-2 fw-semibold" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Submit for Approval
          </button>
        </form>
        <p class="text-center small mt-3 mb-0">Already registered? <router-link to="/login">Sign In</router-link></p>
      </div>
    </div>`,
  data:() => ({ f:{company_name:"",email:"",password:"",hr_name:"",hr_contact:"",industry:"",headquarters:"",website:"",description:""}, errMsg:"", loading:false }),
  methods:{
    async submit(){
      this.errMsg=""; this.loading=true;
      try{
        await Api.registerCompany(this.f);
        this.$store.dispatch("toast",{message:"Registration submitted! Await admin approval."});
        this.$router.push("/login");
      }catch(e){ this.errMsg=e.message||"Registration failed."; }
      finally{ this.loading=false; }
    },
  },
};
