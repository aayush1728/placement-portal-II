const AdminApplications = {
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
        <div class="section-title"><i class="bi bi-file-earmark-text"></i>All Applications</div>
        <div class="mb-3">
          <div class="btn-group">
            <button v-for="s in ['','applied','shortlisted','selected','rejected']" :key="s"
                    class="btn btn-sm" :class="statusFilter===s?'btn-primary-ppa':'btn-outline-secondary'"
                    @click="statusFilter=s; load(1)">
              {{ s||'All' }}
            </button>
          </div>
        </div>
        <loading-spinner v-if="loading"></loading-spinner>
        <template v-else>
          <div v-if="!apps.length" class="empty-state"><i class="bi bi-file-earmark-text"></i>No applications found.</div>
          <div class="table-responsive" v-else>
            <table class="table ppa-table align-middle">
              <thead><tr>
                <th>Student</th><th>Roll No.</th><th>Company</th><th>Job Title</th><th>Applied On</th><th>Status</th>
              </tr></thead>
              <tbody>
                <tr v-for="a in apps" :key="a.id">
                  <td>
                    <div class="fw-semibold">{{ a.student.full_name }}</div>
                    <small class="text-muted">{{ a.student.email }}</small>
                  </td>
                  <td>{{ a.student.roll_number }}</td>
                  <td>{{ a.drive.company_name }}</td>
                  <td>{{ a.drive.job_title }}</td>
                  <td><small>{{ new Date(a.applied_at).toLocaleDateString('en-IN') }}</small></td>
                  <td><span class="status-badge" :class="'badge-'+a.status">{{ a.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <pagination-bar :total="total" :pages="pages" :current="page" @change="load"></pagination-bar>
        </template>
      </div>
    </div>`,
  components:{"loading-spinner":LoadingSpinner,"pagination-bar":PaginationBar},
  data:()=>({apps:[],loading:true,statusFilter:"",page:1,pages:1,total:0}),
  mounted(){ this.load(1); },
  methods:{
    async load(p=1){
      this.loading=true; this.page=p;
      try{
        const r=await Api.adminApplications({page:p,per_page:15,status:this.statusFilter});
        this.apps=r.applications; this.total=r.total; this.pages=r.pages;
      }catch(e){ this.$store.dispatch("toast",{message:"Failed to load applications.",type:"error"}); }
      finally{ this.loading=false; }
    },
  },
};
