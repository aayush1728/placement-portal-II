const Navbar = {
  template: `
    <nav class="navbar navbar-expand-lg ppa-navbar px-3">
      <a class="navbar-brand" href="#"><i class="bi bi-mortarboard-fill me-2"></i>PlacementPortal
        <span class="badge-role" v-if="$store.getters.isLoggedIn">{{ $store.getters.userRole }}</span>
      </a>
      <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
        <i class="bi bi-list text-white fs-4"></i>
      </button>
      <div class="collapse navbar-collapse" id="navMenu">
        <ul class="navbar-nav ms-auto align-items-lg-center gap-1">
          <template v-if="!$store.getters.isLoggedIn">
            <li class="nav-item"><router-link class="nav-link" to="/login">Login</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/register/student">Student Register</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/register/company">Company Register</router-link></li>
          </template>
          <template v-else>
            <li class="nav-item">
              <span class="nav-link text-white-50 small">
                <i class="bi bi-person-circle me-1"></i>{{ $store.getters.displayName }}
              </span>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" @click.prevent="logout" style="color:var(--accent) !important">
                <i class="bi bi-box-arrow-right me-1"></i>Logout
              </a>
            </li>
          </template>
        </ul>
      </div>
    </nav>`,
  methods: {
    logout() { this.$store.dispatch("logout"); this.$router.push("/login"); },
  },
};
