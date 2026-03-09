const AvailableDrives = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold"><i class="bi bi-search me-2 text-primary"></i>Browse Drives</h5>
    </div>
    <div class="px-3">
      <!-- Search & filter -->
      <div class="card stat-card p-3 mb-4">
        <div class="row g-2 align-items-end">
          <div class="col-md-5">
            <input v-model="search" type="text" class="form-control form-control-sm"
                   placeholder="Search by company or job title..." @input="debounceSearch" />
          </div>
          <div class="col-md-4">
            <label class="form-check-label small">
              <input v-model="eligibleOnly" type="checkbox" class="form-check-input me-1"
                     @change="fetchDrives" />
              Show only eligible drives
            </label>
          </div>
        </div>
      </div>

      <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>
      <div v-else>
        <div v-if="drives.length === 0" class="text-center text-muted py-5">
          <i class="bi bi-briefcase fs-1 d-block mb-2"></i>
          No drives available at this time.
        </div>
        <div class="row g-3">
          <div class="col-md-6" v-for="d in drives" :key="d.id">
            <div class="drive-card card p-3 h-100">
              <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <h6 class="fw-bold mb-0">{{ d.job_title }}</h6>
                    <span v-if="!d.is_eligible" class="badge bg-secondary">Not Eligible</span>
                    <span v-else-if="d.has_applied" class="badge bg-success">Applied</span>
                    <span v-else class="badge bg-primary">Eligible</span>
                  </div>
                  <div class="text-primary fw-semibold small">{{ d.company_name }}</div>
                </div>
                <span class="badge bg-info text-dark">{{ d.job_type }}</span>
              </div>

              <p class="small text-muted mt-2 mb-2 drive-desc" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
                {{ d.job_description }}
              </p>

              <div class="row g-1 small text-muted mb-2">
                <div class="col-6">
                  <i class="bi bi-geo-alt me-1"></i>{{ d.location || 'Remote' }}
                </div>
                <div class="col-6" v-if="d.package_lpa">
                  <i class="bi bi-currency-rupee"></i>{{ d.package_lpa }} LPA
                </div>
                <div class="col-6">
                  <i class="bi bi-mortarboard me-1"></i>Min CGPA {{ d.min_cgpa || 0 }}
                </div>
                <div class="col-6" v-if="d.seats">
                  <i class="bi bi-people me-1"></i>{{ d.seats }} seats
                </div>
              </div>

              <div class="small mb-3">
                <i class="bi bi-calendar me-1 text-danger"></i>
                <strong>Deadline:</strong> {{ fmtDate(d.application_deadline) }}
                <span class="ms-2 text-muted">({{ daysLeft(d.application_deadline) }})</span>
              </div>

              <div v-if="d.eligible_branches" class="mb-2">
                <span v-for="b in d.eligible_branches.split(',')" :key="b"
                      class="badge bg-light text-dark border me-1 small">{{ b.trim() }}</span>
              </div>

              <div class="mt-auto">
                <button v-if="d.has_applied" class="btn btn-success btn-sm w-100" disabled>
                  <i class="bi bi-check-circle me-1"></i>Applied ({{ d.application_status }})
                </button>
                <button v-else-if="!d.is_eligible" class="btn btn-secondary btn-sm w-100" disabled>
                  Not Eligible
                </button>
                <button v-else class="btn btn-primary btn-sm w-100"
                        :disabled="applying === d.id" @click="apply(d)">
                  <span v-if="applying===d.id" class="spinner-border spinner-border-sm me-1"></span>
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() { return { drives: [], loading: true, search: '', eligibleOnly: false, applying: null, timer: null }; },
  mounted() { this.fetchDrives(); },
  methods: {
    async fetchDrives() {
      this.loading = true;
      try {
        const res = await API.availableDrives({ q: this.search, eligible_only: this.eligibleOnly });
        this.drives = res.data.drives;
      } catch { store.addToast('Failed to load drives', 'error'); }
      finally { this.loading = false; }
    },
    debounceSearch() { clearTimeout(this.timer); this.timer = setTimeout(() => this.fetchDrives(), 400); },
    async apply(d) {
      if (!confirm(`Apply to "${d.job_title}" at ${d.company_name}?`)) return;
      this.applying = d.id;
      try {
        await API.applyToDrive(d.id);
        store.addToast(`Applied to ${d.job_title} successfully!`);
        d.has_applied = true;
        d.application_status = 'applied';
      } catch (e) {
        store.addToast(e.response?.data?.error || 'Application failed', 'error');
      } finally { this.applying = null; }
    },
    fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; },
    daysLeft(deadline) {
      const diff = new Date(deadline) - new Date();
      if (diff < 0) return 'Closed';
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days === 0 ? 'Today' : `${days} days left`;
    }
  }
};
