/**
 * api.js — Centralized API client for Placement Portal
 * All HTTP requests go through this module.
 */
const API_BASE = "/api";

const Api = (() => {
  function getToken() {
    return localStorage.getItem("ppa_token") || "";
  }

  function headers(extra = {}) {
    const h = { "Content-Type": "application/json" };
    const t = getToken();
    if (t) h["Authorization"] = `Bearer ${t}`;
    return { ...h, ...extra };
  }

  async function request(method, path, body = null, multipart = false) {
    const opts = { method, headers: multipart ? { Authorization: `Bearer ${getToken()}` } : headers() };
    if (body && !multipart) opts.body = JSON.stringify(body);
    if (body && multipart)  opts.body = body;     // FormData
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, message: data.error || "Request failed" };
    return data;
  }

  return {
    get:    (path)          => request("GET",    path),
    post:   (path, body)    => request("POST",   path, body),
    put:    (path, body)    => request("PUT",    path, body),
    patch:  (path, body)    => request("PATCH",  path, body),
    delete: (path)          => request("DELETE", path),
    upload: (path, formData)=> request("POST",   path, formData, true),

    // Auth
    login:           (creds)   => request("POST", "/auth/login", creds),
    registerStudent: (data)    => request("POST", "/auth/register/student", data),
    registerCompany: (data)    => request("POST", "/auth/register/company", data),
    me:              ()        => request("GET",  "/auth/me"),

    // Admin
    adminStats:      ()        => request("GET",  "/admin/stats"),
    adminCompanies:  (params)  => request("GET",  `/admin/companies?${new URLSearchParams(params)}`),
    adminStudents:   (params)  => request("GET",  `/admin/students?${new URLSearchParams(params)}`),
    adminDrives:     (params)  => request("GET",  `/admin/drives?${new URLSearchParams(params)}`),
    adminApplications:(params) => request("GET",  `/admin/applications?${new URLSearchParams(params)}`),
    updateCompany:   (id, data)=> request("PATCH",`/admin/companies/${id}`, data),
    updateStudent:   (id, data)=> request("PATCH",`/admin/students/${id}`, data),
    updateDrive:     (id, data)=> request("PATCH",`/admin/drives/${id}`, data),
    monthlyReport:   (m, y)    => request("GET",  `/admin/report/monthly?month=${m}&year=${y}`),

    // Company
    companyProfile:     ()        => request("GET",  "/company/profile"),
    updateCompanyProfile:(data)   => request("PUT",  "/company/profile", data),
    companyDrives:      ()        => request("GET",  "/company/drives"),
    createDrive:        (data)    => request("POST", "/company/drives", data),
    updateMyDrive:      (id, data)=> request("PUT",  `/company/drives/${id}`, data),
    driveApplications:  (id, p)   => request("GET",  `/company/drives/${id}/applications?${new URLSearchParams(p||{})}`),
    updateAppStatus:    (id, data)=> request("PATCH",`/company/applications/${id}`, data),

    // Student
    studentProfile:     ()        => request("GET",  "/student/profile"),
    updateStudentProfile:(data)   => request("PUT",  "/student/profile", data),
    uploadResume:       (fd)      => request("POST", "/student/resume", fd, true),
    studentDrives:      (params)  => request("GET",  `/student/drives?${new URLSearchParams(params)}`),
    applyDrive:         (id)      => request("POST", `/student/drives/${id}/apply`),
    myApplications:     ()        => request("GET",  "/student/applications"),
    exportCSV:          ()        => request("POST", "/student/export-csv"),
    exportStatus:       (taskId)  => request("GET",  `/student/export-status/${taskId}`),
  };
})();
