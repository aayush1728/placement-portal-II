const AdminCompanies = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold"><i class="bi bi-building me-2 text-primary"></i>Manage Companies</h5>
    </div>
    <div class="px-3">
      <!-- Filters -->
      <div class="card stat-card p-3 mb-4">
        <div class="row g-2 align-items-end">
          <div class="col-md-5">
            <label class="form-label small">Search</label>
            <input v-model="search" type="text" class="form-control form-control-sm"
                   placeholder="Search company name..." @input="debounceSearch" />
          </div>
          <div class="col-md-4">
            <label class="form-label small">Status Filter</label>
            <select v-model="statusFilter" class="form-select form-select-sm" @change="fetchCompanies(1)">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div class="col-md-3">
            <button class="btn btn-primary btn-sm w-100" @click="fetchCompanies(1)">
              <i class="bi bi-search me-1"></i>Search
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>

      <div v-else>
        <div class="card stat-card">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr>
                  <th>#</th><th>Company</th><th>Industry</th>
                  <th>HR Contact</th><th>Status</th><th>Registered</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="companies.length === 0">
                  <td colspan="7" class="text-center py-4 text-muted">No companies found.</td>
                </tr>
                <tr v-for="c in companies" :key="c.id">
                  <td>{{ c.id }}</td>
                  <td>
                    <div class="fw-semibold">{{ c.company_name }}</div>
                    <small class="text-muted">{{ c.email }}</small>
                  </td>
                  <td><small>{{ c.industry || '—' }}</small></td>
                  <td>
                    <small>{{ c.hr_name || '—' }}<br>{{ c.hr_email || '' }}</small>
                  </td>
                  <td>
                    <span class="badge rounded-pill"
                          :class="'badge-' + c.approval_status">
                      {{ c.approval_status }}
                    </span>
                    <span v-if="c.is_blacklisted" class="badge bg-dark ms-1">blacklisted</span>
                  </td>
                  <td><small>{{ fmtDate(c.registered_at) }}</small></td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button v-if="c.approval_status==='pending'"
                              class="btn btn-success" @click="approve(c)"
                              title="Approve"><i class="bi bi-check-lg"></i></button>
                      <button v-if="c.approval_status==='pending'"
                              class="btn btn-danger" @click="reject(c)"
                              title="Reject"><i class="bi bi-x-lg"></i></button>
                      <button class="btn btn-outline-dark" @click="toggleBlacklist(c)"
                              :title="c.is_blacklisted ? 'Unblacklist' : 'Blacklist'">
                        <i :class="c.is_blacklisted ? 'bi-shield-check' : 'bi-shield-x'" class="bi"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center mt-3">
          <small class="text-muted">Showing {{ companies.length }} of {{ total }}</small>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: page===1 }">
                <a class="page-link" href="#" @click.prevent="fetchCompanies(page-1)">‹</a>
              </li>
              <li class="page-item" v-for="p in pages" :key="p" :class="{ active: p===page }">
                <a class="page-link" href="#" @click.prevent="fetchCompanies(p)">{{ p }}</a>
              </li>
              <li class="page-item" :class="{ disabled: page===totalPages }">
                <a class="page-link" href="#" @click.prevent="fetchCompanies(page+1)">›</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return { companies: [], loading: true, search: '', statusFilter: '', page: 1, total: 0, totalPages: 1, timer: null };
  },
  computed: {
    pages() {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
  },
  mounted() {
    const urlStatus = this.$route.query.status || '';
    this.statusFilter = urlStatus;
    this.fetchCompanies(1);
  },
  methods: {
    async fetchCompanies(pg = 1) {
      this.loading = true; this.page = pg;
      try {
        const res = await API.adminCompanies({ page: pg, per_page: 15, q: this.search, status: this.statusFilter });
        this.companies = res.data.companies;
        this.total = res.data.total;
        this.totalPages = res.data.pages;
      } catch { store.addToast('Failed to load companies', 'error'); }
      finally { this.loading = false; }
    },
    debounceSearch() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.fetchCompanies(1), 400);
    },
    async approve(c) {
      if (!confirm(`Approve "${c.company_name}"?`)) return;
      try {
        await API.approveCompany(c.id);
        store.addToast(`${c.company_name} approved`);
        this.fetchCompanies(this.page);
      } catch (e) { store.addToast(e.response?.data?.error || 'Error', 'error'); }
    },
    async reject(c) {
      if (!confirm(`Reject "${c.company_name}"?`)) return;
      try {
        await API.rejectCompany(c.id);
        store.addToast(`${c.company_name} rejected`, 'warning');
        this.fetchCompanies(this.page);
      } catch (e) { store.addToast(e.response?.data?.error || 'Error', 'error'); }
    },
    async toggleBlacklist(c) {
      const action = c.is_blacklisted ? 'Unblacklist' : 'Blacklist';
      if (!confirm(`${action} "${c.company_name}"?`)) return;
      try {
        const res = await API.blacklistCompany(c.id);
        store.addToast(res.data.message, 'warning');
        this.fetchCompanies(this.page);
      } catch (e) { store.addToast('Error', 'error'); }
    },
    fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; },
  }
};
