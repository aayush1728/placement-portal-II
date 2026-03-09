// Vue Router 4 — hash history (no server config needed)
const routes = [
  // Public
  { path: '/',         redirect: '/login' },
  { path: '/login',    component: LoginPage },
  { path: '/register/student',  component: StudentRegister },
  { path: '/register/company',  component: CompanyRegister },

  // Admin
  { path: '/admin',              component: AdminDashboard,    meta: { role: 'admin' } },
  { path: '/admin/companies',    component: AdminCompanies,    meta: { role: 'admin' } },
  { path: '/admin/students',     component: AdminStudents,     meta: { role: 'admin' } },
  { path: '/admin/drives',       component: AdminDrives,       meta: { role: 'admin' } },
  { path: '/admin/applications', component: AdminApplications, meta: { role: 'admin' } },

  // Company
  { path: '/company',                              component: CompanyDashboard,   meta: { role: 'company' } },
  { path: '/company/drives',                       component: CompanyDrives,      meta: { role: 'company' } },
  { path: '/company/drives/new',                   component: DriveForm,          meta: { role: 'company' } },
  { path: '/company/drives/:id/applications',      component: DriveApplications,  meta: { role: 'company' } },

  // Student
  { path: '/student',               component: StudentDashboard, meta: { role: 'student' } },
  { path: '/student/drives',        component: AvailableDrives,  meta: { role: 'student' } },
  { path: '/student/applications',  component: MyApplications,   meta: { role: 'student' } },
  { path: '/student/profile',       component: StudentProfile,   meta: { role: 'student' } },

  // Catch-all
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const required = to.meta.role;
  if (!required) return next();

  if (!store.isLoggedIn()) return next('/login');

  if (store.role() !== required) {
    const dest = { admin: '/admin', company: '/company', student: '/student' }[store.role()] || '/login';
    return next(dest);
  }
  next();
});
