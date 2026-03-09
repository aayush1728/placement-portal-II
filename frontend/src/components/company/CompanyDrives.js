// ── Drive Creation Form ──────────────────────────────────────
const DriveForm = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold">
        <i class="bi bi-plus-circle me-2 text-primary"></i>Post a New Placement Drive
      </h5>
    </div>
    <div class="px-3">
      <div class="card stat-card p-4" style="max-width:720px">
        <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

        <div class="row g-3">
          <div class="col-md-8">
            <label class="form-label fw-semibold">Job Title *</label>
            <input v-model="form.job_title" class="form-control" placeholder="e.g. Software Engineer" />
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold">Job Type</label>
            <select v-model="form.job_type" class="form-select">
              <option>Full-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </div>

          <div class="col-12">
            <label class="form-label fw-semibold">Job Description *</label>
            <textarea v-model="form.job_description" class="form-control" rows="4"
                      placeholder="Describe the role, responsibilities, and requirements..."></textarea>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-semibold">Location</label>
            <input v-model="form.location" class="form-control" placeholder="City / Remote" />
          </div>
          <div class="col-md-3">
            <label class="form-label fw-semibold">Package (LPA)</label>
            <input v-model="form.package_lpa" type="number" min="0" step="0.5" class="form-control" placeholder="e.g. 12" />
          </div>
          <div class="col-md-3">
            <label class="form-label fw-semibold">Seats</label>
            <input v-model="form.seats" type="number" min="1" class="form-control" placeholder="e.g. 10" />
          </div>

          <div class="col-12">
            <label class="form-label fw-semibold">Eligible Branches (comma-separated)</label>
            <input v-model="form.eligible_branches" class="form-control"
                   placeholder="CSE, ECE, IT" />
            <div class="form-text">Leave blank for all branches</div>
          </div>

          <div class="col-md-4">
            <label class="form-label fw-semibold">Minimum CGPA</label>
            <input v-model="form.min_cgpa" type="number" min="0" max="10" step="0.1"
                   class="form-control" placeholder="e.g. 7.0" />
          </div>
          <div class="col-md-8">
            <label class="form-label fw-semibold">Eligible Years (comma-separated)</label>
            <input v-model="form.eligible_years" class="form-control" placeholder="3, 4" />
            <div class="form-text">Leave blank for all years</div>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-semibold">Application Deadline *</label>
            <input v-model="form.application_deadline" type="datetime-local" class="form-control" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold">Drive / Interview Date</label>
            <input v-model="form.drive_date" type="datetime-local" class="form-control" />
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button class="btn btn-primary px-4" :disabled="loading" @click="submit">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Submit for Approval
          </button>
          <router-link to="/company/drives" class="btn btn-outline-secondary">Cancel</router-link>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      form: {
        job_title: '', job_description: '', job_type: 'Full-time',
        location: '', package_lpa: '', seats: '',
        eligible_branches: '', min_cgpa: 0, eligible_years: '',
        application_deadline: '', drive_date: '',
      },
      loading: false, error: '',
    };
  },
  methods: {
    async submit() {
      if (!this.form.job_title || !this.form.job_description || !this.form.application_deadline) {
        this.error = 'Please fill in all required fields.'; return;
      }
      this.loading = true; this.error = '';
      try {
        await API.createDrive({
          ...this.form,
          package_lpa: this.form.package_lpa ? parseFloat(this.form.package_lpa) : null,
          seats: this.form.seats ? parseInt(this.form.seats) : null,
          min_cgpa: parseFloat(this.form.min_cgpa) || 0,
        });
        store.addToast('Drive submitted for admin approval!');
        router.push('/company/drives');
      } catch (e) {
        this.error = e.response?.data?.error || 'Failed to create drive.';
      } finally { this.loading = false; }
    }
  }
};

// ── Company Drives List ──────────────────────────────────────
const CompanyDrives = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold"><i class="bi bi-briefcase me-2 text-primary"></i>My Drives</h5>
      <router-link to="/company/drives/new" class="btn btn-primary btn-sm">
        <i class="bi bi-plus me-1"></i>Post Drive
      </router-link>
    </div>
    <div class="px-3">
      <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>
      <div v-else>
        <div v-if="drives.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-briefcase fs-1 d-block mb-2"></i>
          No drives yet. Post your first drive!
        </div>
        <div v-else class="row g-3">
          <div class="col-md-6" v-for="d in drives" :key="d.id">
            <div class="drive-card card p-3">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="fw-bold mb-1">{{ d.job_title }}</h6>
                  <span class="badge bg-info text-dark me-1">{{ d.job_type }}</span>
                  <span class="badge rounded-pill" :class="'badge-' + d.status">{{ d.status }}</span>
                </div>
                <span class="text-muted small">{{ fmtDate(d.created_at) }}</span>
              </div>
              <div class="mt-2 text-muted small">
                <i class="bi bi-geo-alt me-1"></i>{{ d.location || 'Remote' }}
                <span class="ms-3"><i class="bi bi-currency-rupee"></i>{{ d.package_lpa || '—' }} LPA</span>
                <span class="ms-3"><i class="bi bi-calendar me-1"></i>Deadline {{ fmtDate(d.application_deadline) }}</span>
              </div>
              <div class="mt-2">
                <span class="badge bg-secondary me-2">{{ d.applicant_count }} applicants</span>
                <span v-if="d.seats" class="badge bg-light text-dark border">{{ d.seats }} seats</span>
              </div>
              <div class="mt-3 d-flex gap-2">
                <router-link :to="'/company/drives/' + d.id + '/applications'"
                             class="btn btn-outline-primary btn-sm flex-fill">
                  <i class="bi bi-people me-1"></i>Applications
                </router-link>
                <button v-if="d.status === 'approved'"
                        class="btn btn-outline-secondary btn-sm" @click="closeDrive(d)">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() { return { drives: [], loading: true }; },
  async mounted() {
    try {
      const res = await API.companyDrives();
      this.drives = res.data.drives;
    } catch { store.addToast('Failed to load drives', 'error'); }
    finally { this.loading = false; }
  },
  methods: {
    async closeDrive(d) {
      if (!confirm(`Close "${d.job_title}"? No more applications will be accepted.`)) return;
      try {
        await API.closeDrive(d.id);
        store.addToast('Drive closed');
        d.status = 'closed';
      } catch (e) { store.addToast(e.response?.data?.error || 'Error', 'error'); }
    },
    fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }
  }
};
