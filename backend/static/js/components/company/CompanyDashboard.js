const CompanyDashboard = {
  template:`
    <div class="page-layout">
      <div class="ppa-sidebar"><ul class="nav flex-column">
        <li><router-link class="nav-link" to="/company"><i class="bi bi-speedometer2"></i>Dashboard</router-link></li>
        <li><router-link class="nav-link" to="/company/drives"><i class="bi bi-briefcase"></i>My Drives</router-link></li>
        <li><router-link class="nav-link" to="/company/profile"><i class="bi bi-building-gear"></i>Profile</router-link></li>
      </ul></div>
      <div class="ppa-content">
        <loading-spinner v-if="loading"></loading-spinner>
        <template v-else-if="profile">
          <div class="d-flex align-items-start gap-3 mb-4">
            <div style="width:64px;height:64px;background:#eef2ff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:var(--primary)">
              <i class="bi bi-building-fill"></i>
            </div>
            <div>
              <h4 class="fw-bold mb-0">{{ profile.company_name }}</h4>
              <span class="text-muted small">{{ profile.industry || 'Technology' }} · {{ profile.headquarters || '—' }}</span>
              <div class="mt-1">
                <span class="status-badge" :class="'badge-'+profile.approval_status">{{ profile.approval_status }}</span>
              </div>
            </div>
          </div>
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <div class="stat-card">
                <div class="stat-value">{{ profile.drives_count || 0 }}</div>
                <div class="stat-label">Total Drives Created</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="stat-card">
                <div class="stat-value">{{ activeDrives }}</div>
                <div class="stat-label">Active Drives</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="stat-card">
                <div class="stat-value">{{ totalApplicants }}</div>
                <div class="stat-label">Total Applicants</div>
              </div>
            </div>
          </div>
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
              <span class="fw-semibold">Recent Drives</span>
              <router-link to="/company/drives" class="btn btn-sm btn-primary-ppa">View All</router-link>
            </div>
            <div class="card-body p-0">
              <div v-if="!recentDrives.length" class="empty-state py-4">
                <i class="bi bi-briefcase"></i>No drives yet. <router-link to="/company/drives">Create one!</router-link>
              </div>
              <table v-else class="table ppa-table mb-0">
                <thead><tr><th>Job Title</th><th>Type</th><th>Applicants</th><th>Deadline</th><th>Status</th></tr></thead>
                <tbody>
                  <tr v-for="d in recentDrives" :key="d.id">
                    <td class="fw-semibold">{{ d.job_title }}</td>
                    <td><small class="badge bg-light text-dark">{{ d.job_type }}</small></td>
                    <td><span class="badge bg-secondary">{{ d.applications_count }}</span></td>
                    <td><small>{{ d.application_deadline ? new Date(d.application_deadline).toLocaleDateString('en-IN') : '—' }}</small></td>
                    <td><span class="status-badge" :class="'badge-'+d.status">{{ d.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </div>`,
  components:{"loading-spinner":LoadingSpinner},
  data:()=>({profile:null,recentDrives:[],loading:true}),
  computed:{
    activeDrives(){ return this.recentDrives.filter(d=>d.status==='approved').length; },
    totalApplicants(){ return this.recentDrives.reduce((s,d)=>s+(d.applications_count||0),0); },
  },
  async mounted(){
    try{
      [this.profile, {drives:this.recentDrives}] = await Promise.all([Api.companyProfile(), Api.companyDrives()]);
    }catch(e){ this.$store.dispatch("toast",{message:"Failed to load data.",type:"error"}); }
    finally{ this.loading=false; }
  },
};
