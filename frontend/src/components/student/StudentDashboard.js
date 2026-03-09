const StudentDashboard = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold">
        <i class="bi bi-speedometer2 me-2 text-primary"></i>Student Dashboard
      </h5>
      <div v-if="student" class="text-muted small">{{ student.full_name }}</div>
    </div>

    <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>
    <div v-else class="px-3">
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

      <!-- Quick actions -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <router-link to="/student/drives"
            class="card stat-card p-3 text-decoration-none text-dark d-flex flex-row align-items-center gap-3">
            <div class="icon-wrap" style="background:#e3f2fd">
              <i class="bi bi-search" style="color:#1565c0"></i>
            </div>
            <div>
              <div class="fw-semibold">Browse Drives</div>
              <small class="text-muted">{{ stats.open_eligible_drives }} eligible drives open</small>
            </div>
          </router-link>
        </div>
        <div class="col-md-4">
          <router-link to="/student/applications"
            class="card stat-card p-3 text-decoration-none text-dark d-flex flex-row align-items-center gap-3">
            <div class="icon-wrap" style="background:#e8f5e9">
              <i class="bi bi-file-earmark-check" style="color:#2e7d32"></i>
            </div>
            <div>
              <div class="fw-semibold">My Applications</div>
              <small class="text-muted">{{ stats.total_applications }} total</small>
            </div>
          </router-link>
        </div>
        <div class="col-md-4">
          <div class="card stat-card p-3 d-flex flex-row align-items-center gap-3"
               style="cursor:pointer" @click="exportCsv">
            <div class="icon-wrap" style="background:#fce4ec">
              <i class="bi bi-download" style="color:#c62828"></i>
            </div>
            <div>
              <div class="fw-semibold">Export History</div>
              <small class="text-muted">Download CSV via email</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent applications -->
      <div class="card stat-card p-3">
        <h6 class="fw-semibold mb-3">
          <i class="bi bi-clock-history me-2 text-primary"></i>Recent Applications
        </h6>
        <div v-if="!recentApps || recentApps.length === 0" class="text-muted text-center py-3">
          No applications yet.
          <router-link to="/student/drives">Browse available drives →</router-link>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light"><tr>
              <th>Company</th><th>Role</th><th>Applied</th><th>Status</th>
            </tr></thead>
            <tbody>
              <tr v-for="a in recentApps" :key="a.id">
                <td><div class="fw-semibold">{{ a.company_name }}</div></td>
                <td><small>{{ a.job_title }}</small></td>
                <td><small>{{ fmtDate(a.applied_at) }}</small></td>
                <td><span class="badge rounded-pill" :class="'badge-' + a.status">{{ a.status }}</span></td>
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
      loading: true, student: null, stats: {}, recentApps: [],
      statCards: [
        { key: 'total_applications', label: 'Applications', icon: 'bi-file-earmark-fill', bg: '#e3f2fd', color: '#1565c0' },
        { key: 'shortlisted', label: 'Shortlisted', icon: 'bi-star-fill', bg: '#fff3e0', color: '#e65100' },
        { key: 'selected', label: 'Selected', icon: 'bi-trophy-fill', bg: '#e8f5e9', color: '#2e7d32' },
        { key: 'pending_review', label: 'Under Review', icon: 'bi-hourglass-split', bg: '#fce4ec', color: '#c62828' },
      ],
    };
  },
  async mounted() {
    try {
      const res = await API.studentDashboard();
      this.student = res.data.student;
      this.stats = res.data.stats;
      this.recentApps = res.data.recent_applications;
    } catch { store.addToast('Failed to load dashboard', 'error'); }
    finally { this.loading = false; }
  },
  methods: {
    async exportCsv() {
      try {
        await API.triggerCsvExport();
        store.addToast('CSV export started! You will receive an email shortly.');
      } catch (e) {
        store.addToast(e.response?.data?.error || 'Export failed', 'error');
      }
    },
    fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }
  }
};
