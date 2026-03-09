const CompanyApplications = {
  template:`
    <div class="page-layout">
      <div class="ppa-sidebar"><ul class="nav flex-column">
        <li><router-link class="nav-link" to="/company"><i class="bi bi-speedometer2"></i>Dashboard</router-link></li>
        <li><router-link class="nav-link" to="/company/drives"><i class="bi bi-briefcase"></i>My Drives</router-link></li>
        <li><router-link class="nav-link" to="/company/profile"><i class="bi bi-building-gear"></i>Profile</router-link></li>
      </ul></div>
      <div class="ppa-content">
        <div class="d-flex align-items-center gap-2 mb-3">
          <router-link to="/company/drives" class="btn btn-sm btn-outline-secondary">
            <i class="bi bi-arrow-left"></i>
          </router-link>
          <div class="section-title mb-0">
            <i class="bi bi-people"></i>{{ drive ? drive.job_title : 'Applications' }}
          </div>
        </div>
        <div class="mb-3">
          <div class="btn-group btn-group-sm">
            <button v-for="s in ['','applied','shortlisted','selected','rejected']" :key="s"
              class="btn" :class="statusFilter===s?'btn-primary-ppa':'btn-outline-secondary'"
              @click="statusFilter=s; load()">{{ s||'All' }}
            </button>
          </div>
        </div>
        <loading-spinner v-if="loading"></loading-spinner>
        <template v-else>
          <div v-if="!apps.length" class="empty-state"><i class="bi bi-people"></i>No applications yet.</div>
          <div class="table-responsive" v-else>
            <table class="table ppa-table align-middle">
              <thead><tr><th>Student</th><th>Branch</th><th>CGPA</th><th>Applied On</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr v-for="a in apps" :key="a.id">
                  <td>
                    <div class="fw-semibold">{{ a.student.full_name }}</div>
                    <small class="text-muted">{{ a.student.email }}</small>
                  </td>
                  <td><small>{{ a.student.branch||'—' }}</small></td>
                  <td><strong>{{ a.student.cgpa }}</strong></td>
                  <td><small>{{ new Date(a.applied_at).toLocaleDateString('en-IN') }}</small></td>
                  <td><span class="status-badge" :class="'badge-'+a.status">{{ a.status }}</span></td>
                  <td>
                    <select class="form-select form-select-sm" style="width:130px" :value="a.status" @change="changeStatus(a,$event.target.value)">
                      <option value="applied">Applied</option>
                      <option value="shortlisted">Shortlist</option>
                      <option value="selected">Select</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>`,
  components:{"loading-spinner":LoadingSpinner},
  data:()=>({apps:[],drive:null,loading:true,statusFilter:""}),
  computed:{ driveId(){ return this.$route.params.id; } },
  mounted(){ this.load(); },
  methods:{
    async load(){
      this.loading=true;
      try{
        const r = await Api.driveApplications(this.driveId,{status:this.statusFilter});
        this.apps=r.applications; this.drive=r.drive;
      }catch(e){ this.$store.dispatch("toast",{message:"Failed to load.",type:"error"}); }
      finally{ this.loading=false; }
    },
    async changeStatus(a, status){
      try{
        await Api.updateAppStatus(a.id,{status});
        this.$store.dispatch("toast",{message:`Status updated to ${status}.`});
        a.status=status;
      }catch(e){ this.$store.dispatch("toast",{message:e.message,type:"error"}); }
    },
  },
};
