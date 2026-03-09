const DriveApplications = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <div>
        <button class="btn btn-link btn-sm text-decoration-none ps-0 me-2"
                @click="$router.back()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <span class="fw-bold fs-5">Drive Applications</span>
        <div v-if="drive" class="text-muted small mt-1">
          {{ drive.job_title }} · {{ drive.company_name }}
        </div>
      </div>
      <select v-model="statusFilter" class="form-select form-select-sm w-auto" @change="fetchApps">
        <option value="">All Statuses</option>
        <option value="applied">Applied</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="interview_scheduled">Interview Scheduled</option>
        <option value="selected">Selected</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>

    <div class="px-3">
      <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>
      <div v-else>
        <div v-if="apps.length === 0" class="text-center text-muted py-5">
          <i class="bi bi-inbox fs-1 d-block mb-2"></i>No applications yet.
        </div>
        <div v-else class="row g-3">
          <div class="col-md-6" v-for="a in apps" :key="a.id">
            <div class="card stat-card p-3">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="fw-bold">{{ a.student_name }}</div>
                  <div class="text-muted small">{{ a.student_email }}</div>
                  <div class="small mt-1">
                    <span class="badge bg-secondary me-1">{{ a.student_branch }}</span>
                    <span class="badge bg-light text-dark border me-1">CGPA {{ a.student_cgpa }}</span>
                    <span class="badge bg-light text-dark border">Year {{ a.student_year }}</span>
                  </div>
                </div>
                <span class="badge rounded-pill" :class="'badge-' + a.status">{{ a.status }}</span>
              </div>

              <div v-if="a.interview_date" class="small text-muted mt-2">
                <i class="bi bi-calendar-event me-1"></i>
                Interview: {{ fmtDate(a.interview_date) }}
              </div>
              <div v-if="a.company_remarks" class="small text-muted mt-1">
                <i class="bi bi-chat me-1"></i>{{ a.company_remarks }}
              </div>

              <!-- Status update -->
              <div class="mt-3">
                <div class="input-group input-group-sm">
                  <select v-model="a._newStatus" class="form-select">
                    <option value="">Change status...</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview_scheduled">Schedule Interview</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button class="btn btn-primary" :disabled="!a._newStatus"
                          @click="updateStatus(a)">
                    Update
                  </button>
                </div>
                <div v-if="a._newStatus === 'interview_scheduled'" class="mt-2">
                  <input v-model="a._interviewDate" type="datetime-local"
                         class="form-control form-control-sm" placeholder="Interview Date" />
                  <input v-model="a._remarks" type="text" class="form-control form-control-sm mt-1"
                         placeholder="Remarks (optional)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return { apps: [], drive: null, loading: true, statusFilter: '' };
  },
  mounted() { this.fetchApps(); },
  methods: {
    async fetchApps() {
      this.loading = true;
      try {
        const id = this.$route.params.id;
        const res = await API.driveApplications(id, { status: this.statusFilter });
        this.drive = res.data.drive;
        this.apps = res.data.applications.map(a => ({
          ...a, _newStatus: '', _interviewDate: '', _remarks: ''
        }));
      } catch { store.addToast('Failed to load applications', 'error'); }
      finally { this.loading = false; }
    },
    async updateStatus(a) {
      if (!a._newStatus) return;
      try {
        const payload = { status: a._newStatus };
        if (a._newStatus === 'interview_scheduled' && a._interviewDate) {
          payload.interview_date = a._interviewDate;
        }
        if (a._remarks) payload.company_remarks = a._remarks;

        const res = await API.updateApplicationStatus(a.id, payload);
        Object.assign(a, res.data.application);
        a._newStatus = ''; a._interviewDate = ''; a._remarks = '';
        store.addToast('Status updated');
      } catch (e) {
        store.addToast(e.response?.data?.error || 'Update failed', 'error');
      }
    },
    fmtDate(d) { return d ? new Date(d).toLocaleString('en-IN') : '—'; }
  }
};
