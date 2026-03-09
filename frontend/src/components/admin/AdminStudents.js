const AdminStudents = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold"><i class="bi bi-people me-2 text-primary"></i>Manage Students</h5>
    </div>
    <div class="px-3">
      <div class="card stat-card p-3 mb-4">
        <div class="row g-2 align-items-end">
          <div class="col-md-5">
            <label class="form-label small">Search</label>
            <input v-model="search" type="text" class="form-control form-control-sm"
                   placeholder="Name or branch..." @input="debounceSearch" />
          </div>
          <div class="col-md-4">
            <label class="form-label small">Branch Filter</label>
            <select v-model="branchFilter" class="form-select form-select-sm" @change="fetchStudents(1)">
              <option value="">All Branches</option>
              <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <button class="btn btn-primary btn-sm w-100" @click="fetchStudents(1)">
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
                  <th>#</th><th>Name</th><th>Branch</th><th>CGPA</th>
                  <th>Year</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="students.length === 0">
                  <td colspan="7" class="text-center py-4 text-muted">No students found.</td>
                </tr>
                <tr v-for="s in students" :key="s.id">
                  <td>{{ s.id }}</td>
                  <td>
                    <div class="fw-semibold">{{ s.full_name }}</div>
                    <small class="text-muted">{{ s.email }}</small>
                  </td>
                  <td><span class="badge bg-secondary">{{ s.branch }}</span></td>
                  <td>{{ s.cgpa }}</td>
                  <td>{{ s.year }}</td>
                  <td>
                    <span v-if="s.is_blacklisted" class="badge bg-dark">Blacklisted</span>
                    <span v-else-if="!s.is_active" class="badge bg-secondary">Inactive</span>
                    <span v-else class="badge bg-success">Active</span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-dark" @click="toggleBlacklist(s)"
                              :title="s.is_blacklisted ? 'Remove Blacklist' : 'Blacklist'">
                        <i :class="s.is_blacklisted ? 'bi-shield-check' : 'bi-shield-x'" class="bi"></i>
                      </button>
                      <button class="btn btn-outline-secondary" @click="toggleActivate(s)"
                              :title="s.is_active ? 'Deactivate' : 'Activate'">
                        <i :class="s.is_active ? 'bi-person-dash' : 'bi-person-check'" class="bi"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <small class="text-muted">{{ students.length }} of {{ total }}</small>
          <nav><ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{disabled:page===1}">
              <a class="page-link" href="#" @click.prevent="fetchStudents(page-1)">‹</a>
            </li>
            <li v-for="p in totalPages" :key="p" class="page-item" :class="{active:p===page}">
              <a class="page-link" href="#" @click.prevent="fetchStudents(p)">{{ p }}</a>
            </li>
            <li class="page-item" :class="{disabled:page===totalPages}">
              <a class="page-link" href="#" @click.prevent="fetchStudents(page+1)">›</a>
            </li>
          </ul></nav>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      students: [], loading: true, search: '', branchFilter: '',
      page: 1, total: 0, totalPages: 1, timer: null,
      branches: ['CSE','ECE','EEE','ME','CE','IT','AI/ML','Data Science','Chemical','Biotechnology'],
    };
  },
  mounted() { this.fetchStudents(1); },
  methods: {
    async fetchStudents(pg = 1) {
      this.loading = true; this.page = pg;
      try {
        const res = await API.adminStudents({ page: pg, per_page: 15, q: this.search, branch: this.branchFilter });
        this.students = res.data.students;
        this.total = res.data.total;
        this.totalPages = res.data.pages;
      } catch { store.addToast('Failed to load students', 'error'); }
      finally { this.loading = false; }
    },
    debounceSearch() { clearTimeout(this.timer); this.timer = setTimeout(() => this.fetchStudents(1), 400); },
    async toggleBlacklist(s) {
      const action = s.is_blacklisted ? 'Unblacklist' : 'Blacklist';
      if (!confirm(`${action} ${s.full_name}?`)) return;
      try {
        const r = await API.blacklistStudent(s.id);
        store.addToast(r.data.message, 'warning');
        this.fetchStudents(this.page);
      } catch { store.addToast('Error', 'error'); }
    },
    async toggleActivate(s) {
      const action = s.is_active ? 'Deactivate' : 'Activate';
      if (!confirm(`${action} ${s.full_name}?`)) return;
      try {
        const r = await API.deactivateStudent(s.id);
        store.addToast(r.data.message, 'warning');
        this.fetchStudents(this.page);
      } catch { store.addToast('Error', 'error'); }
    },
  }
};
