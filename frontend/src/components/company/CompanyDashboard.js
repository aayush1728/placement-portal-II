const CompanyDashboard = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold"><i class="bi bi-speedometer2 me-2 text-primary"></i>Company Dashboard</h5>
      <span v-if="company" class="badge"
            :class="company.approval_status==='approved' ? 'bg-success' : company.approval_status==='pending' ? 'bg-warning text-dark' : 'bg-danger'">
        {{ company.approval_status }}
      </span>
    </div>

    <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="company" class="px-3">

      <!-- Pending approval banner -->
      <div v-if="company.approval_status !== 'approved'" class="alert alert-warning mb-4">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <strong>Awaiting admin approval.</strong>
        You can post placement drives once your profile is approved.
      </div>

      <!-- Stats -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3" v-for="s in statCards" :key="s.label">
          <div class="stat-card card p-3">
            <div class="d-flex align-items-center gap-3">
              <div class="icon-wrap" :style="{background: s.bg}">
                <i :class="s.icon" class="bi" :style="{color: s.color}"></i>
              </div>
              <div>
                <div class="fs-2 fw-bold">{{ stats[s.key] ?? 0 }}</div>
                <div class="text-muted small">{{ s.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent drives -->
      <div class="card stat-card p-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="fw-semibold mb-0"><i class="bi bi-briefcase me-2"></i>Your Drives</h6>
          <router-link to="/company/drives/new" class="btn btn-primary btn-sm">
            <i class="bi bi-plus me-1"></i>Post New Drive
          </router-link>
        </div>
        <div v-if="drives.length === 0" class="text-center text-muted py-4">
          No drives posted yet.
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr><th>Drive</th><th>Deadline</th><th>Applicants</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="d in drives" :key="d.id">
                <td>
                  <div class="fw-semibold">{{ d.job_title }}</div>
                  <small class="text-muted">{{ d.job_type }} · {{ d.location || 'Remote' }}</small>
                </td>
                <td><small>{{ fmtDate(d.application_deadline) }}</small></td>
                <td><span class="badge bg-secondary">{{ d.applicant_count }}</span></td>
                <td><span class="badge rounded-pill" :class="'badge-' + d.status">{{ d.status }}</span></td>
                <td>
                  <router-link :to="'/company/drives/' + d.id + '/applications'"
                               class="btn btn-outline-primary btn-sm">
                    View Applications
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      loading: true, company: null, stats: {}, drives: [],
      statCards: [
        { key: 'total_drives', label: 'Total Drives', icon: 'bi-briefcase-fill', bg: '#e3f2fd', color: '#1565c0' },
        { key: 'total_applicants', label: 'Applicants', icon: 'bi-people-fill', bg: '#e8f5e9', color: '#2e7d32' },
        { key: 'shortlisted', label: 'Shortlisted', icon: 'bi-star-fill', bg: '#fff3e0', color: '#e65100' },
        { key: 'selected', label: 'Selected', icon: 'bi-trophy-fill', bg: '#fce4ec', color: '#c62828' },
      ],
    };
  },
  async mounted() {
    try {
      const res = await API.companyDashboard();
      this.company = res.data.company;
      this.stats = res.data.stats;
      this.drives = res.data.drives;
    } catch { store.addToast('Failed to load dashboard', 'error'); }
    finally { this.loading = false; }
  },
  methods: {
    fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }
  }
};
