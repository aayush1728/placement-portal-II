// ── My Applications ───────────────────────────────────────────
const MyApplications = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold">
        <i class="bi bi-file-earmark-check me-2 text-primary"></i>My Applications
      </h5>
      <button class="btn btn-outline-primary btn-sm" @click="exportCsv">
        <i class="bi bi-download me-1"></i>Export CSV
      </button>
    </div>
    <div class="px-3">
      <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>
      <div v-else>
        <div v-if="apps.length === 0" class="text-center text-muted py-5">
          <i class="bi bi-inbox fs-1 d-block mb-2"></i>
          No applications yet. <router-link to="/student/drives">Browse drives →</router-link>
        </div>
        <div v-else class="row g-3">
          <div class="col-md-6" v-for="a in apps" :key="a.id">
            <div class="card stat-card p-3">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="fw-bold mb-1">{{ a.job_title }}</h6>
                  <div class="text-primary fw-semibold small">{{ a.company_name }}</div>
                </div>
                <span class="badge rounded-pill" :class="'badge-' + a.status">
                  {{ a.status.replace('_', ' ') }}
                </span>
              </div>
              <div class="small text-muted mt-2">
                <i class="bi bi-calendar-check me-1"></i>Applied {{ fmtDate(a.applied_at) }}
              </div>
              <div v-if="a.interview_date" class="small text-primary mt-1">
                <i class="bi bi-camera-video me-1"></i>
                Interview: {{ fmtDateTime(a.interview_date) }}
              </div>
              <div v-if="a.interview_notes" class="small text-muted mt-1">
                <i class="bi bi-sticky me-1"></i>{{ a.interview_notes }}
              </div>
              <div v-if="a.company_remarks" class="small mt-1 p-2 bg-light rounded">
                <strong>Company note:</strong> {{ a.company_remarks }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() { return { apps: [], loading: true }; },
  async mounted() {
    try {
      const res = await API.myApplications();
      this.apps = res.data.applications;
    } catch { store.addToast('Failed to load applications', 'error'); }
    finally { this.loading = false; }
  },
  methods: {
    async exportCsv() {
      try {
        await API.triggerCsvExport();
        store.addToast('Export started! Check your email shortly.');
      } catch (e) { store.addToast(e.response?.data?.error || 'Export failed', 'error'); }
    },
    fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; },
    fmtDateTime(d) { return d ? new Date(d).toLocaleString('en-IN') : '—'; },
  }
};


// ── Student Profile ───────────────────────────────────────────
const StudentProfile = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold"><i class="bi bi-person-circle me-2 text-primary"></i>My Profile</h5>
    </div>
    <div class="px-3">
      <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>
      <div v-else class="row g-4">
        <!-- Profile form -->
        <div class="col-md-7">
          <div class="card stat-card p-4">
            <h6 class="fw-semibold mb-3">Profile Details</h6>
            <div v-if="success" class="alert alert-success py-2">{{ success }}</div>
            <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Full Name</label>
                <input v-model="form.full_name" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Phone</label>
                <input v-model="form.phone" class="form-control" placeholder="+91 XXXXXXXXXX" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Branch</label>
                <select v-model="form.branch" class="form-select">
                  <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">CGPA</label>
                <input v-model="form.cgpa" type="number" min="0" max="10" step="0.01" class="form-control" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Year</label>
                <select v-model="form.year" class="form-select">
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Skills (comma-separated)</label>
                <input v-model="form.skills" class="form-control"
                       placeholder="Python, React, SQL, Machine Learning" />
              </div>
              <div class="col-12">
                <label class="form-label">About Me</label>
                <textarea v-model="form.about" class="form-control" rows="3"
                          placeholder="Brief introduction..."></textarea>
              </div>
            </div>
            <button class="btn btn-primary mt-3" :disabled="saving" @click="saveProfile">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              Save Changes
            </button>
          </div>
        </div>

        <!-- Resume & stats -->
        <div class="col-md-5">
          <div class="card stat-card p-4 mb-3">
            <h6 class="fw-semibold mb-3"><i class="bi bi-file-earmark-person me-2"></i>Resume</h6>
            <div v-if="form.resume_filename" class="alert alert-success py-2 small">
              <i class="bi bi-check-circle me-1"></i>{{ form.resume_filename }}
            </div>
            <div v-else class="text-muted small mb-2">No resume uploaded yet.</div>
            <input type="file" class="form-control form-control-sm" ref="resumeInput"
                   accept=".pdf,.doc,.docx" @change="uploadResume" />
            <div class="form-text">PDF, DOC, or DOCX — max 5MB</div>
          </div>

          <div class="card stat-card p-4">
            <h6 class="fw-semibold mb-2">Account Info</h6>
            <dl class="small mb-0">
              <dt class="text-muted">Email</dt>
              <dd>{{ store.user.email }}</dd>
              <dt class="text-muted">Username</dt>
              <dd>{{ store.user.username }}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      loading: true, saving: false, error: '', success: '',
      form: {},
      branches: ['CSE','ECE','EEE','ME','CE','IT','AI/ML','Data Science','Chemical','Biotechnology','Other'],
    };
  },
  computed: {
    store() { return store; }
  },
  async mounted() {
    try {
      const res = await API.getMe();
      const p = res.data.profile;
      this.form = {
        full_name: p.full_name, phone: p.phone || '',
        branch: p.branch, cgpa: p.cgpa, year: p.year,
        skills: p.skills || '', about: p.about || '',
        resume_filename: p.resume_filename || '',
      };
    } catch { store.addToast('Failed to load profile', 'error'); }
    finally { this.loading = false; }
  },
  methods: {
    async saveProfile() {
      this.saving = true; this.error = ''; this.success = '';
      try {
        await API.updateStudentProfile({
          ...this.form,
          cgpa: parseFloat(this.form.cgpa),
          year: parseInt(this.form.year),
        });
        this.success = 'Profile updated successfully!';
        store.addToast('Profile saved');
      } catch (e) { this.error = e.response?.data?.error || 'Save failed'; }
      finally { this.saving = false; }
    },
    async uploadResume(e) {
      const file = e.target.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('resume', file);
      try {
        const res = await api.post('/student/profile/resume', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.form.resume_filename = res.data.filename;
        store.addToast('Resume uploaded!');
      } catch (e) {
        store.addToast(e.response?.data?.error || 'Upload failed', 'error');
      }
    }
  }
};
