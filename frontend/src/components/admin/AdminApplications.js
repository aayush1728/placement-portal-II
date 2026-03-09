const AdminApplications = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold"><i class="bi bi-file-earmark-text me-2 text-primary"></i>All Applications</h5>
    </div>
    <div class="px-3">
      <div class="card stat-card p-3 mb-4">
        <div class="row g-2">
          <div class="col-md-4">
            <select v-model="statusFilter" class="form-select form-select-sm" @change="fetchApps(1)">
              <option value="">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>
      <div v-else>
        <div class="card stat-card">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr><th>#</th><th>Student</th><th>Drive / Company</th>
                    <th>Applied</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr v-if="apps.length===0">
                  <td colspan="5" class="text-center py-4 text-muted">No applications found.</td>
                </tr>
                <tr v-for="a in apps" :key="a.id">
                  <td>{{ a.id }}</td>
                  <td>
                    <div class="fw-semibold">{{ a.student_name }}</div>
                    <small class="text-muted">{{ a.student_email }}<br>
                    {{ a.student_branch }} | CGPA {{ a.student_cgpa }}</small>
                  </td>
                  <td>
                    <div class="fw-semibold">{{ a.job_title }}</div>
                    <small class="text-muted">{{ a.company_name }}</small>
                  </td>
                  <td><small>{{ fmtDate(a.applied_at) }}</small></td>
                  <td>
                    <span class="badge rounded-pill" :class="'badge-' + a.status">{{ a.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="d-flex justify-content-between mt-3">
          <small class="text-muted">{{ apps.length }} of {{ total }}</small>
          <nav><ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{disabled:page===1}">
              <a class="page-link" href="#" @click.prevent="fetchApps(page-1)">‹</a>
            </li>
            <li v-for="p in totalPages" :key="p" class="page-item" :class="{active:p===page}">
              <a class="page-link" href="#" @click.prevent="fetchApps(p)">{{ p }}</a>
            </li>
            <li class="page-item" :class="{disabled:page===totalPages}">
              <a class="page-link" href="#" @click.prevent="fetchApps(page+1)">›</a>
            </li>
          </ul></nav>
        </div>
      </div>
    </div>
  </div>
  `,
  data() { return { apps: [], loading: true, statusFilter: '', page: 1, total: 0, totalPages: 1 }; },
  mounted() { this.fetchApps(1); },
  methods: {
    async fetchApps(pg = 1) {
      this.loading = true; this.page = pg;
      try {
        const res = await API.adminApplications({ page: pg, per_page: 20, status: this.statusFilter });
        this.apps = res.data.applications;
        this.total = res.data.total;
        this.totalPages = res.data.pages;
      } catch { store.addToast('Failed', 'error'); }
      finally { this.loading = false; }
    },
    fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; },
  }
};
