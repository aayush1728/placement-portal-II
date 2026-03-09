const RegisterStudent = {
  template:`
    <div class="auth-wrapper">
      <div class="auth-card" style="max-width:520px">
        <div class="text-center mb-3">
          <i class="bi bi-person-plus-fill fs-2 text-primary"></i>
          <h4 class="fw-bold mt-1">Student Registration</h4>
        </div>
        <form @submit.prevent="submit">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Full Name *</label>
              <input v-model="f.full_name" class="form-control" required placeholder="Rahul Sharma">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Roll Number *</label>
              <input v-model="f.roll_number" class="form-control" required placeholder="22CS001">
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">Email *</label>
              <input v-model="f.email" class="form-control" type="email" required placeholder="student@college.edu">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Password *</label>
              <input v-model="f.password" class="form-control" type="password" required placeholder="Min 6 chars" minlength="6">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Branch</label>
              <select v-model="f.branch" class="form-select">
                <option value="">Select branch</option>
                <option>Computer Science</option><option>Information Technology</option>
                <option>Electronics</option><option>Electrical</option>
                <option>Mechanical</option><option>Civil</option><option>Chemical</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">CGPA</label>
              <input v-model.number="f.cgpa" class="form-control" type="number" step="0.01" min="0" max="10" placeholder="8.5">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Current Year</label>
              <select v-model.number="f.year" class="form-select">
                <option value="1">1st Year</option><option value="2">2nd Year</option>
                <option value="3">3rd Year</option><option value="4">4th Year</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Graduation Year</label>
              <input v-model.number="f.grad_year" class="form-control" type="number" placeholder="2026">
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">Phone</label>
              <input v-model="f.phone" class="form-control" placeholder="9876543210">
            </div>
          </div>
          <div v-if="errMsg" class="alert alert-danger py-2 small mt-3">{{ errMsg }}</div>
          <button class="btn btn-primary-ppa w-100 mt-3 py-2 fw-semibold" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Register as Student
          </button>
        </form>
        <p class="text-center small mt-3 mb-0">Already have an account? <router-link to="/login">Sign In</router-link></p>
      </div>
    </div>`,
  data:() => ({ f:{full_name:"",roll_number:"",email:"",password:"",branch:"",cgpa:0,year:1,grad_year:2026,phone:""}, errMsg:"", loading:false }),
  methods:{
    async submit(){
      this.errMsg=""; this.loading=true;
      try{
        await Api.registerStudent(this.f);
        this.$store.dispatch("toast",{message:"Registration successful! Please log in."});
        this.$router.push("/login");
      }catch(e){ this.errMsg=e.message||"Registration failed."; }
      finally{ this.loading=false; }
    },
  },
};
