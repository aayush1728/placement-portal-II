const AdminDrives = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold"><i class="bi bi-briefcase me-2 text-primary"></i>Manage Drives</h5>
    </div>
    <div class="px-3">
      <div class="card stat-card p-3 mb-4">
        <div class="row g-2 align-items-end">
          <div class="col-md-5">
            <input v-model="search" type="text" class="form-control form-control-sm"
                   placeholder="Search job title..." @input="debounceSearch" />
          </div>
          <div class="col-md-4">
            <select v-model="statusFilter" class="form-select form-select-sm" @change="fetchDrives(1)">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div class="col-md-3">
            <button class="btn btn-primary btn-sm w-100" @click="fetchDrives(1)">Search</button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>
      <div v-else>
        <div class="card stat-card">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr><th>#</th><th>Drive</th><th>Company</th><th>Type</th>
                    <th>Deadline</th><th>Applicants</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                <tr v-if="drives.length===0">
                  <td colspan="8" class="text-center py-4 text-muted">No drives found.</td>
                </tr>
                <tr v-for="d in drives" :key="d.id">
                  <td>{{ d.id }}</td>
                  <td>
                    <div class="fw-semibold">{{ d.job_title }}</div>
                    <small class="text-muted">{{ d.package_lpa ? d.package_lpa + ' LPA' : '' }}</small>
                  </td>
                  <td><small>{{ d.company_name }}</small></td>
                  <td><span class="badge bg-info text-dark">{{ d.job_type }}</span></td>
                  <td><small>{{ fmtDate(d.application_deadline) }}</small></td>
                  <td>
                    <span class="badge bg-secondary">{{ d.applicant_count }}</span>
                  </td>
                  <td>
                    <span class="badge rounded-pill" :class="'badge-' + d.status">{{ d.status }}</span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button v-if="d.status==='pending'"
                              class="btn btn-success" @click="approve(d)" title="Approve">
                        <i class="bi bi-check-lg"></i>
                      </button>
                      <button v-if="d.status==='pending'"
                              class="btn btn-danger" @click="reject(d)" title="Reject">
                        <i class="bi bi-x-lg"></i>
                      </button>
                      <button v-if="d.status==='approved'"
                              class="btn btn-outline-secondary" @click="close(d)" title="Close">
                        <i class="bi bi-lock"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="d-flex justify-content-between mt-3">
          <small class="text-muted">{{ drives.length }} of {{ total }}</small>
          <nav><ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{disabled:page===1}">
              <a class="page-link" href="#" @click.prevent="fetchDrives(page-1)">‹</a>
            </li>
            <li v-for="p in totalPages" :key="p" class="page-item" :class="{active:p===page}">
              <a class="page-link" href="#" @click.prevent="fetchDrives(p)">{{ p }}</a>
            </li>
            <li class="page-item" :class="{disabled:page===totalPages}">
              <a class="page-link" href="#" @click.prevent="fetchDrives(page+1)">›</a>
            </li>
          </ul></nav>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return { drives: [], loading: true, search: '', statusFilter: '', page: 1, total: 0, totalPages: 1, timer: null };
  },
  mounted() {
    this.statusFilter = this.$route.query.status || '';
    this.fetchDrives(1);
  },
  methods: {
    async fetchDrives(pg = 1) {
      this.loading = true; this.page = pg;
      try {
        const res = await API.adminDrives({ page: pg, per_page: 15, q: this.search, status: this.statusFilter });
        this.drives = res.data.drives;
        this.total = res.data.total;
        this.totalPages = res.data.pages;
      } catch { store.addToast('Failed to load drives', 'error'); }
      finally { this.loading = false; }
    },
    debounceSearch() { clearTimeout(this.timer); this.timer = setTimeout(() => this.fetchDrives(1), 400); },
    async approve(d) {
      if (!confirm(`Approve "${d.job_title}"?`)) return;
      try { await API.approveDrive(d.id); store.addToast('Drive approved'); this.fetchDrives(this.page); }
      catch (e) { store.addToast(e.response?.data?.error || 'Error', 'error'); }
    },
    async reject(d) {
      if (!confirm(`Reject "${d.job_title}"?`)) return;
      try { await API.rejectDrive(d.id); store.addToast('Drive rejected', 'warning'); this.fetchDrives(this.page); }
      catch (e) { store.addToast('Error', 'error'); }
    },
    async close(d) {
      if (!confirm(`Close drive "${d.job_title}"?`)) return;
      try { await API.closeDriveAdmin(d.id); store.addToast('Drive closed'); this.fetchDrives(this.page); }
      catch (e) { store.addToast('Error', 'error'); }
    },
    fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; },
  }
};
