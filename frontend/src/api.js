// Central Axios instance with JWT injection
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  if (store.token) {
    cfg.headers['Authorization'] = `Bearer ${store.token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      store.logout();
      router && router.push('/login');
    }
    return Promise.reject(err);
  }
);

// Convenience helpers
const API = {
  // Auth
  login: (data) => api.post('/auth/login', data),
  registerStudent: (data) => api.post('/auth/register/student', data),
  registerCompany: (data) => api.post('/auth/register/company', data),
  getMe: () => api.get('/auth/me'),

  // Admin
  adminDashboard: () => api.get('/admin/dashboard'),
  adminCompanies: (params) => api.get('/admin/companies', { params }),
  approveCompany: (id) => api.put(`/admin/companies/${id}/approve`),
  rejectCompany: (id) => api.put(`/admin/companies/${id}/reject`),
  blacklistCompany: (id) => api.put(`/admin/companies/${id}/blacklist`),
  adminStudents: (params) => api.get('/admin/students', { params }),
  blacklistStudent: (id) => api.put(`/admin/students/${id}/blacklist`),
  deactivateStudent: (id) => api.put(`/admin/students/${id}/deactivate`),
  adminDrives: (params) => api.get('/admin/drives', { params }),
  approveDrive: (id) => api.put(`/admin/drives/${id}/approve`),
  rejectDrive: (id) => api.put(`/admin/drives/${id}/reject`),
  closeDriveAdmin: (id) => api.put(`/admin/drives/${id}/close`),
  adminApplications: (params) => api.get('/admin/applications', { params }),
  monthlyReport: (month) => api.get('/admin/reports/monthly', { params: { month } }),

  // Company
  companyDashboard: () => api.get('/company/dashboard'),
  companyDrives: () => api.get('/company/drives'),
  createDrive: (data) => api.post('/company/drives', data),
  updateDrive: (id, data) => api.put(`/company/drives/${id}`, data),
  closeDrive: (id) => api.put(`/company/drives/${id}/close`),
  driveApplications: (id, params) => api.get(`/company/drives/${id}/applications`, { params }),
  updateApplicationStatus: (id, data) => api.put(`/company/applications/${id}/status`, data),
  updateCompanyProfile: (data) => api.put('/company/profile', data),

  // Student
  studentDashboard: () => api.get('/student/dashboard'),
  availableDrives: (params) => api.get('/student/drives', { params }),
  driveDetail: (id) => api.get(`/student/drives/${id}`),
  applyToDrive: (id) => api.post(`/student/drives/${id}/apply`),
  myApplications: () => api.get('/student/applications'),
  updateStudentProfile: (data) => api.put('/student/profile', data),
  triggerCsvExport: () => api.post('/student/export-csv'),
  csvExportStatus: (taskId) => api.get(`/student/export-csv/status/${taskId}`),
};
