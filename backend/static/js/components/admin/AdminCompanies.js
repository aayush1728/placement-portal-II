const AdminCompanies = {
  template:`
    <div class="page-layout">
      <div class="ppa-sidebar">
        <ul class="nav flex-column">
          <li><router-link class="nav-link" to="/admin"><i class="bi bi-speedometer2"></i>Dashboard</router-link></li>
          <li><router-link class="nav-link" to="/admin/companies"><i class="bi bi-building"></i>Companies</router-link></li>
          <li><router-link class="nav-link" to="/admin/students"><i class="bi bi-people"></i>Students</router-link></li>
          <li><router-link class="nav-link" to="/admin/drives"><i class="bi bi-briefcase"></i>Drives</router-link></li>
          <li><router-link class="nav-link" to="/admin/applications"><i class="bi bi-file-earmark-text"></i>Applications</router-link></li>
        </ul>
      </div>
      <div class="ppa-content">
        <div class="section-title"><i class="bi bi-building"></i>Manage Companies</div>
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <div class="row g-2 align-items-end">
              <div class="col-md-5">
                <input v-model="search" class="form-control" placeholder="Search by company name..." @input="debounceSearch">
              </div>
              <div class="col-md-3">
                <select v-model="statusFilter" class="form-select" @change="load(1)">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <loading-spinner v-if="loading"></loading-spinner>
        <template v-else>
          <div v-if="!companies.length" class="empty-state"><i class="bi bi-building"></i>No companies found.</div>
          <div class="table-responsive" v-else>
            <table class="table ppa-table align-middle">
              <thead><tr>
                <th>Company</th><th>Industry</th><th>HR Contact</th>
                <th>Drives</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                <tr v-for="c in companies" :key="c.id">
                  <td>
                    <div class="fw-semibold">{{ c.company_name }}</div>
                    <small class="text-muted">{{ c.email }}</small>
                  </td>
                  <td><small>{{ c.industry||'—' }}</small></td>
                  <td><small>{{ c.hr_name||'—' }}</small></td>
                  <td><span class="badge bg-secondary">{{ c.drives_count||0 }}</span></td>
                  <td>
                    <span class="status-badge" :class="'badge-'+c.approval_status">{{ c.approval_status }}</span>
                    <span v-if="c.is_blacklisted" class="status-badge badge-rejected ms-1">blacklisted</span>
                  </td>
                  <td>
                    <div class="d-flex gap-1 flex-wrap">
                      <button v-if="c.approval_status==='pending'" class="btn btn-sm btn-success" @click="updateStatus(c,'approved')">
                        <i class="bi bi-check-lg"></i>
                      </button>
                      <button v-if="c.approval_status==='pending'" class="btn btn-sm btn-danger" @click="updateStatus(c,'rejected')">
                        <i class="bi bi-x-lg"></i>
                      </button>
                      <button class="btn btn-sm" :class="c.is_blacklisted?'btn-outline-success':'btn-outline-danger'" @click="toggleBlacklist(c)">
                        <i class="bi" :class="c.is_blacklisted?'bi-unlock':'bi-slash-circle'"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <pagination-bar :total="total" :pages="pages" :current="page" @change="load"></pagination-bar>
        </template>
      </div>
    </div>`,
  components:{"loading-spinner":LoadingSpinner,"pagination-bar":PaginationBar},
  data:()=>({companies:[],loading:true,search:"",statusFilter:"",page:1,pages:1,total:0,_timer:null}),
  mounted(){ this.load(1); },
  methods:{
    debounceSearch(){ clearTimeout(this._timer); this._timer=setTimeout(()=>this.load(1),400); },
    async load(p=1){
      this.loading=true; this.page=p;
      try{
        const r=await Api.adminCompanies({page:p,per_page:10,status:this.statusFilter,search:this.search});
        this.companies=r.companies; this.total=r.total; this.pages=r.pages;
      }catch(e){ this.$store.dispatch("toast",{message:"Failed to load companies.",type:"error"}); }
      finally{ this.loading=false; }
    },
    async updateStatus(c,status){
      try{
        await Api.updateCompany(c.id,{approval_status:status});
        this.$store.dispatch("toast",{message:`Company ${status}.`});
        this.load(this.page);
      }catch(e){ this.$store.dispatch("toast",{message:e.message,type:"error"}); }
    },
    async toggleBlacklist(c){
      try{
        await Api.updateCompany(c.id,{is_blacklisted:!c.is_blacklisted});
        this.$store.dispatch("toast",{message:`Company ${c.is_blacklisted?'un-blacklisted':'blacklisted'}.`});
        this.load(this.page);
      }catch(e){ this.$store.dispatch("toast",{message:e.message,type:"error"}); }
    },
  },
};
