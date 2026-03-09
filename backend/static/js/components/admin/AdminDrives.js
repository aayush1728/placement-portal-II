const AdminDrives = {
  template:`
    <div class="page-layout">
      <div class="ppa-sidebar"><ul class="nav flex-column">
        <li><router-link class="nav-link" to="/admin"><i class="bi bi-speedometer2"></i>Dashboard</router-link></li>
        <li><router-link class="nav-link" to="/admin/companies"><i class="bi bi-building"></i>Companies</router-link></li>
        <li><router-link class="nav-link" to="/admin/students"><i class="bi bi-people"></i>Students</router-link></li>
        <li><router-link class="nav-link" to="/admin/drives"><i class="bi bi-briefcase"></i>Drives</router-link></li>
        <li><router-link class="nav-link" to="/admin/applications"><i class="bi bi-file-earmark-text"></i>Applications</router-link></li>
      </ul></div>
      <div class="ppa-content">
        <div class="section-title"><i class="bi bi-briefcase"></i>Placement Drives</div>
        <div class="mb-3">
          <div class="btn-group">
            <button v-for="s in ['','pending','approved','rejected','closed']" :key="s"
                    class="btn btn-sm" :class="statusFilter===s?'btn-primary-ppa':'btn-outline-secondary'"
                    @click="statusFilter=s; load(1)">
              {{ s||'All' }}
            </button>
          </div>
        </div>
        <loading-spinner v-if="loading"></loading-spinner>
        <template v-else>
          <div v-if="!drives.length" class="empty-state"><i class="bi bi-briefcase"></i>No drives found.</div>
          <div class="table-responsive" v-else>
            <table class="table ppa-table align-middle">
              <thead><tr>
                <th>Job Title</th><th>Company</th><th>Type</th><th>Package</th><th>Deadline</th><th>Applicants</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                <tr v-for="d in drives" :key="d.id">
                  <td class="fw-semibold">{{ d.job_title }}</td>
                  <td>{{ d.company_name }}</td>
                  <td><small class="badge bg-light text-dark">{{ d.job_type }}</small></td>
                  <td>{{ d.package_lpa ? d.package_lpa+' LPA' : '—' }}</td>
                  <td><small>{{ d.application_deadline ? new Date(d.application_deadline).toLocaleDateString('en-IN') : '—' }}</small></td>
                  <td><span class="badge bg-secondary">{{ d.applications_count }}</span></td>
                  <td><span class="status-badge" :class="'badge-'+d.status">{{ d.status }}</span></td>
                  <td>
                    <div class="d-flex gap-1">
                      <button v-if="d.status==='pending'" class="btn btn-sm btn-success" @click="changeStatus(d,'approved')" title="Approve">
                        <i class="bi bi-check-lg"></i>
                      </button>
                      <button v-if="d.status==='pending'" class="btn btn-sm btn-danger" @click="changeStatus(d,'rejected')" title="Reject">
                        <i class="bi bi-x-lg"></i>
                      </button>
                      <button v-if="d.status==='approved'" class="btn btn-sm btn-secondary" @click="changeStatus(d,'closed')" title="Close drive">
                        <i class="bi bi-lock"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <pagination-bar :total="total" :pages="pages" :current="page" @change="load"></pagination-bar>
        </template>
      </div>
    </div>`,
  components:{"loading-spinner":LoadingSpinner,"pagination-bar":PaginationBar},
  data:()=>({drives:[],loading:true,statusFilter:"pending",page:1,pages:1,total:0}),
  mounted(){ this.load(1); },
  methods:{
    async load(p=1){
      this.loading=true; this.page=p;
      try{
        const r=await Api.adminDrives({page:p,per_page:12,status:this.statusFilter});
        this.drives=r.drives; this.total=r.total; this.pages=r.pages;
      }catch(e){ this.$store.dispatch("toast",{message:"Failed to load drives.",type:"error"}); }
      finally{ this.loading=false; }
    },
    async changeStatus(d,status){
      try{
        await Api.updateDrive(d.id,{status});
        this.$store.dispatch("toast",{message:`Drive ${status}.`});
        this.load(this.page);
      }catch(e){ this.$store.dispatch("toast",{message:e.message,type:"error"}); }
    },
  },
};
