const CompanyProfile = {
  template:`
    <div class="page-layout">
      <div class="ppa-sidebar"><ul class="nav flex-column">
        <li><router-link class="nav-link" to="/company"><i class="bi bi-speedometer2"></i>Dashboard</router-link></li>
        <li><router-link class="nav-link" to="/company/drives"><i class="bi bi-briefcase"></i>My Drives</router-link></li>
        <li><router-link class="nav-link" to="/company/profile"><i class="bi bi-building-gear"></i>Profile</router-link></li>
      </ul></div>
      <div class="ppa-content">
        <div class="section-title"><i class="bi bi-building-gear"></i>Company Profile</div>
        <loading-spinner v-if="loading"></loading-spinner>
        <div v-else class="card border-0 shadow-sm p-4" style="max-width:600px">
          <form @submit.prevent="save">
            <div class="row g-3">
              <div class="col-12"><label class="form-label fw-semibold">Company Name</label>
                <input v-model="f.company_name" class="form-control" required></div>
              <div class="col-md-6"><label class="form-label fw-semibold">HR Name</label>
                <input v-model="f.hr_name" class="form-control"></div>
              <div class="col-md-6"><label class="form-label fw-semibold">HR Contact</label>
                <input v-model="f.hr_contact" class="form-control"></div>
              <div class="col-md-6"><label class="form-label fw-semibold">Industry</label>
                <input v-model="f.industry" class="form-control"></div>
              <div class="col-md-6"><label class="form-label fw-semibold">Headquarters</label>
                <input v-model="f.headquarters" class="form-control"></div>
              <div class="col-12"><label class="form-label fw-semibold">Website</label>
                <input v-model="f.website" class="form-control" type="url"></div>
              <div class="col-12"><label class="form-label fw-semibold">About</label>
                <textarea v-model="f.description" class="form-control" rows="4"></textarea></div>
            </div>
            <button class="btn btn-primary-ppa mt-3 px-4" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>`,
  components:{"loading-spinner":LoadingSpinner},
  data:()=>({f:{},loading:true,saving:false}),
  async mounted(){
    try{ this.f=await Api.companyProfile(); }
    catch(e){ this.$store.dispatch("toast",{message:"Failed to load profile.",type:"error"}); }
    finally{ this.loading=false; }
  },
  methods:{
    async save(){
      this.saving=true;
      try{ await Api.updateCompanyProfile(this.f); this.$store.dispatch("toast",{message:"Profile updated."}); }
      catch(e){ this.$store.dispatch("toast",{message:e.message,type:"error"}); }
      finally{ this.saving=false; }
    },
  },
};
