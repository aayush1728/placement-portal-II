const AdminDashboard = {
  template: `
  <div>
    <div class="top-bar d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-bold"><i class="bi bi-speedometer2 me-2 text-primary"></i>Admin Dashboard</h5>
      <span class="badge bg-primary">{{ today }}</span>
    </div>

    <div v-if="loading" class="ppa-loader"><div class="spinner-border text-primary"></div></div>

    <div v-else class="px-3">
      <!-- Stats row -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3" v-for="s in statCards" :key="s.label">
          <div class="stat-card card p-3">
            <div class="d-flex align-items-center gap-3">
              <div class="icon-wrap" :style="{ background: s.bg }">
                <i :class="s.icon" class="bi" :style="{ color: s.color }"></i>
              </div>
              <div>
                <div class="fs-2 fw-bold">{{ stats[s.key] ?? 0 }}</div>
                <div class="text-muted small">{{ s.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending actions -->
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card stat-card p-3 h-100">
            <h6 class="fw-semibold mb-3"><i class="bi bi-clock-history me-2 text-warning"></i>Pending Actions</h6>
            <div class="d-flex gap-3 flex-wrap">
              <router-link to="/admin/companies?status=pending"
                class="btn btn-warning btn-sm flex-fill">
                <i class="bi bi-building me-1"></i>
                {{ stats.pending_companies }} Companies pending
              </router-link>
              <router-link to="/admin/drives?status=pending"
                class="btn btn-info btn-sm flex-fill text-white">
                <i class="bi bi-briefcase me-1"></i>
                {{ stats.pending_drives }} Drives pending
              </router-link>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card stat-card p-3 h-100">
            <h6 class="fw-semibold mb-3"><i class="bi bi-bar-chart me-2 text-primary"></i>Placement Summary</h6>
            <div class="row text-center g-2">
              <div class="col-4">
                <div class="text-success fw-bold fs-4">{{ stats.selected_students }}</div>
                <div class="text-muted small">Selected</div>
              </div>
              <div class="col-4">
                <div class="text-primary fw-bold fs-4">{{ stats.total_applications }}</div>
                <div class="text-muted small">Applications</div>
              </div>
              <div class="col-4">
                <div class="text-secondary fw-bold fs-4">{{ stats.total_drives }}</div>
                <div class="text-muted small">Drives</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="card stat-card p-3 mb-4">
        <h6 class="fw-semibold mb-3"><i class="bi bi-graph-up me-2 text-primary"></i>Drive Activity (Last 6 Months)</h6>
        <canvas id="drivesChart" height="90"></canvas>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      loading: true,
      stats: {},
      today: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      statCards: [
        { key: 'total_students', label: 'Students', icon: 'bi-people-fill', bg: '#e3f2fd', color: '#1565c0' },
        { key: 'total_companies', label: 'Companies', icon: 'bi-building-fill', bg: '#fce4ec', color: '#c62828' },
        { key: 'total_drives', label: 'Drives', icon: 'bi-briefcase-fill', bg: '#e8f5e9', color: '#2e7d32' },
        { key: 'total_applications', label: 'Applications', icon: 'bi-file-earmark-fill', bg: '#fff3e0', color: '#e65100' },
      ],
      chartInstance: null,
    };
  },
  async mounted() {
    try {
      const res = await API.adminDashboard();
      this.stats = res.data;
      this.loading = false;
      this.$nextTick(() => this.renderChart(res.data.monthly_drives));
    } catch {
      store.addToast('Failed to load dashboard', 'error');
      this.loading = false;
    }
  },
  methods: {
    renderChart(monthly) {
      const ctx = document.getElementById('drivesChart');
      if (!ctx || !monthly) return;
      if (this.chartInstance) this.chartInstance.destroy();
      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: monthly.map(m => m.month),
          datasets: [{
            label: 'Drives Posted',
            data: monthly.map(m => m.count),
            backgroundColor: '#3949ab',
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }
  },
  unmounted() {
    if (this.chartInstance) this.chartInstance.destroy();
  }
};
