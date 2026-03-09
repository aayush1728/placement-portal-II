// ── Sidebar Navbar ─────────────────────────────────────────────
const Navbar = {
  template: `
  <nav class="sidebar d-flex flex-column py-2" style="min-width:220px">
    <div class="brand d-flex align-items-center gap-2">
      <i class="bi bi-mortarboard-fill fs-4"></i>
      <span>Placement<br><small style="font-weight:400;font-size:.75rem">Portal</small></span>
    </div>
    <hr class="border-secondary mx-3 my-1">

    <!-- Admin links -->
    <ul v-if="role==='admin'" class="nav flex-column px-1 flex-grow-1">
      <li class="nav-item"><router-link to="/admin" class="nav-link" active-class="active">
        <i class="bi bi-speedometer2"></i> Dashboard
      </router-link></li>
      <li class="nav-item"><router-link to="/admin/companies" class="nav-link" active-class="active">
        <i class="bi bi-building"></i> Companies
      </router-link></li>
      <li class="nav-item"><router-link to="/admin/students" class="nav-link" active-class="active">
        <i class="bi bi-people"></i> Students
      </router-link></li>
      <li class="nav-item"><router-link to="/admin/drives" class="nav-link" active-class="active">
        <i class="bi bi-briefcase"></i> Drives
      </router-link></li>
      <li class="nav-item"><router-link to="/admin/applications" class="nav-link" active-class="active">
        <i class="bi bi-file-earmark-text"></i> Applications
      </router-link></li>
    </ul>

    <!-- Company links -->
    <ul v-if="role==='company'" class="nav flex-column px-1 flex-grow-1">
      <li class="nav-item"><router-link to="/company" class="nav-link" active-class="active">
        <i class="bi bi-speedometer2"></i> Dashboard
      </router-link></li>
      <li class="nav-item"><router-link to="/company/drives" class="nav-link" active-class="active">
        <i class="bi bi-briefcase"></i> My Drives
      </router-link></li>
      <li class="nav-item"><router-link to="/company/drives/new" class="nav-link" active-class="active">
        <i class="bi bi-plus-circle"></i> Post Drive
      </router-link></li>
    </ul>

    <!-- Student links -->
    <ul v-if="role==='student'" class="nav flex-column px-1 flex-grow-1">
      <li class="nav-item"><router-link to="/student" class="nav-link" active-class="active">
        <i class="bi bi-speedometer2"></i> Dashboard
      </router-link></li>
      <li class="nav-item"><router-link to="/student/drives" class="nav-link" active-class="active">
        <i class="bi bi-search"></i> Browse Drives
      </router-link></li>
      <li class="nav-item"><router-link to="/student/applications" class="nav-link" active-class="active">
        <i class="bi bi-file-earmark-check"></i> My Applications
      </router-link></li>
      <li class="nav-item"><router-link to="/student/profile" class="nav-link" active-class="active">
        <i class="bi bi-person-circle"></i> My Profile
      </router-link></li>
    </ul>

    <div class="px-3 pb-3 mt-auto">
      <div class="small text-white-50 mb-1">{{ store.user && store.user.username }}</div>
      <button class="btn btn-outline-light btn-sm w-100" @click="logout">
        <i class="bi bi-box-arrow-right me-1"></i>Logout
      </button>
    </div>
  </nav>
  `,
  computed: {
    role() { return store.role(); },
    store() { return store; },
  },
  methods: {
    logout() {
      store.logout();
      router.push('/login');
    }
  }
};

// ── Toast notifications ─────────────────────────────────────────
const ToastContainer = {
  template: `
  <div class="toast-container">
    <div v-for="t in store.toasts" :key="t.id"
         class="toast show align-items-center border-0 mb-2"
         :class="t.type === 'error' ? 'bg-danger text-white' : t.type === 'warning' ? 'bg-warning' : 'bg-success text-white'">
      <div class="d-flex">
        <div class="toast-body">{{ t.message }}</div>
        <button type="button" class="btn-close me-2 m-auto"
                :class="t.type === 'warning' ? '' : 'btn-close-white'"
                @click="store.removeToast(t.id)"></button>
      </div>
    </div>
  </div>
  `,
  computed: { store() { return store; } }
};
