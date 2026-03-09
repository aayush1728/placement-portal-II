const CompanyDrives = {
  template:`
    <div class="page-layout">
      <div class="ppa-sidebar"><ul class="nav flex-column">
        <li><router-link class="nav-link" to="/company"><i class="bi bi-speedometer2"></i>Dashboard</router-link></li>
        <li><router-link class="nav-link" to="/company/drives"><i class="bi bi-briefcase"></i>My Drives</router-link></li>
        <li><router-link class="nav-link" to="/company/profile"><i class="bi bi-building-gear"></i>Profile</router-link></li>
      </ul></div>
      <div class="ppa-content">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="section-title mb-0"><i class="bi bi-briefcase"></i>My Placement Drives</div>
          <button class="btn btn-primary-ppa" @click="openModal()">
            <i class="bi bi-plus-lg me-1"></i>New Drive
          </button>
        </div>
        <loading-spinner v-if="loading"></loading-spinner>
        <template v-else>
          <div v-if="!drives.length" class="empty-state">
            <i class="bi bi-briefcase"></i>
            <p>No drives yet. Create your first placement drive!</p>
          </div>
          <div v-else class="row g-3">
            <div v-for="d in drives" :key="d.id" class="col-md-6 col-lg-4">
              <div class="drive-card h-100">
                <div class="card-top-bar"></div>
                <div class="p-3">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="fw-bold mb-0">{{ d.job_title }}</h6>
                    <span class="status-badge ms-2" :class="'badge-'+d.status">{{ d.status }}</span>
                  </div>
                  <div class="text-muted small mb-2">
                    <i class="bi bi-geo-alt me-1"></i>{{ d.location||'—' }} ·
                    <i class="bi bi-briefcase ms-2 me-1"></i>{{ d.job_type }}
                  </div>
                  <div class="text-muted small mb-3">
                    <i class="bi bi-currency-rupee me-1"></i>{{ d.package_lpa ? d.package_lpa+' LPA' : '—' }} ·
                    <i class="bi bi-people ms-2 me-1"></i>{{ d.applications_count }} applicants
                  </div>
                  <div class="d-flex gap-2">
                    <router-link :to="'/company/applications/'+d.id" class="btn btn-sm btn-outline-primary flex-fill">
                      <i class="bi bi-people me-1"></i>Applicants
                    </router-link>
                    <button class="btn btn-sm btn-outline-secondary" @click="openModal(d)">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Drive Modal -->
        <div v-if="showModal" class="modal d-block" style="background:rgba(0,0,0,.5)">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title fw-bold">{{ editing ? 'Edit Drive' : 'Create New Drive' }}</h5>
                <button class="btn-close" @click="showModal=false"></button>
              </div>
              <div class="modal-body">
                <form @submit.prevent="saveDrive" id="driveForm">
                  <div class="row g-3">
                    <div class="col-md-8"><label class="form-label fw-semibold">Job Title *</label>
                      <input v-model="form.job_title" class="form-control" required></div>
                    <div class="col-md-4"><label class="form-label fw-semibold">Type</label>
                      <select v-model="form.job_type" class="form-select">
                        <option>Full-Time</option><option>Internship</option><option>Contract</option>
                      </select></div>
                    <div class="col-12"><label class="form-label fw-semibold">Job Description</label>
                      <textarea v-model="form.job_description" class="form-control" rows="3"></textarea></div>
                    <div class="col-md-6"><label class="form-label fw-semibold">Location</label>
                      <input v-model="form.location" class="form-control"></div>
                    <div class="col-md-6"><label class="form-label fw-semibold">Package (LPA)</label>
                      <input v-model.number="form.package_lpa" class="form-control" type="number" step="0.5"></div>
                    <div class="col-md-4"><label class="form-label fw-semibold">Min CGPA</label>
                      <input v-model.number="form.min_cgpa" class="form-control" type="number" step="0.1" min="0" max="10"></div>
                    <div class="col-md-4"><label class="form-label fw-semibold">Grad Year</label>
                      <input v-model.number="form.eligible_grad_year" class="form-control" type="number"></div>
                    <div class="col-md-4"><label class="form-label fw-semibold">Application Deadline</label>
                      <input v-model="form.application_deadline" class="form-control" type="datetime-local"></div>
                    <div class="col-12"><label class="form-label fw-semibold">Eligible Branches</label>
                      <input v-model="form.eligible_branches" class="form-control" placeholder="All  or  Computer Science, IT, Electronics"></div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" @click="showModal=false">Cancel</button>
                <button class="btn btn-primary-ppa" form="driveForm" type="submit" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                  {{ editing ? 'Update' : 'Create Drive' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  components:{"loading-spinner":LoadingSpinner},
  data:()=>({drives:[],loading:true,showModal:false,editing:null,saving:false,
    form:{job_title:"",job_description:"",job_type:"Full-Time",location:"",package_lpa:null,min_cgpa:0,eligible_grad_year:null,eligible_branches:"All",application_deadline:""}}),
  async mounted(){ await this.load(); },
  methods:{
    async load(){
      this.loading=true;
      try{ const r=await Api.companyDrives(); this.drives=r.drives; }
      catch(e){ this.$store.dispatch("toast",{message:"Failed to load drives.",type:"error"}); }
      finally{ this.loading=false; }
    },
    openModal(drive=null){
      this.editing=drive;
      this.form = drive ? {...drive} : {job_title:"",job_description:"",job_type:"Full-Time",location:"",package_lpa:null,min_cgpa:0,eligible_grad_year:null,eligible_branches:"All",application_deadline:""};
      this.showModal=true;
    },
    async saveDrive(){
      this.saving=true;
      try{
        if(this.editing) await Api.updateMyDrive(this.editing.id, this.form);
        else await Api.createDrive(this.form);
        this.$store.dispatch("toast",{message:this.editing?"Drive updated!":"Drive created. Pending admin approval."});
        this.showModal=false; await this.load();
      }catch(e){ this.$store.dispatch("toast",{message:e.message,type:"error"}); }
      finally{ this.saving=false; }
    },
  },
};
