const AdminStudents = {
  template:`
    <div class="page-layout">
      <div class="ppa-sidebar"><ul class="nav flex-column">
        <li><router-link class="nav-link" to="/admin"><i class="bi bi-speedometer2"></i>Dashboard</router-link></li>
        <li><router-link class="nav-link" to="/admin/companies"><i class="bi bi-building"></i>Companies</router-link></li>
        <li><router-link class="nav-link" to="/admin/students"><i class="bi bi-people"></i>Students</router-link></li>
        <li><router-link class="nav-link" to="/admin/drives"><i class="bi bi-briefcase"></i>Drives</router-link></li>
        <li><router-link class="nav-link" to="/admin/applications"><i class="bi bi-file-earmark-text"></i>Applications</router-link></li>
      </ul></div>
      <div class="ppa-content">
        <div class="section-title"><i class="bi bi-people"></i>Manage Students</div>
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <div class="row g-2">
              <div class="col-md-5">
                <input v-model="search" class="form-control" placeholder="Search name, roll, email..." @input="debounceSearch">
              </div>
              <div class="col-md-3">
                <input v-model="branch" class="form-control" placeholder="Filter by branch..." @input="debounceSearch">
              </div>
            </div>
          </div>
        </div>
        <loading-spinner v-if="loading"></loading-spinner>
        <template v-else>
          <div v-if="!students.length" class="empty-state"><i class="bi bi-people"></i>No students found.</div>
          <div class="table-responsive" v-else>
            <table class="table ppa-table align-middle">
              <thead><tr>
                <th>Student</th><th>Roll No.</th><th>Branch</th><th>CGPA</th><th>Grad Year</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                <tr v-for="s in students" :key="s.id">
                  <td>
                    <div class="fw-semibold">{{ s.full_name }}</div>
                    <small class="text-muted">{{ s.email }}</small>
                  </td>
                  <td>{{ s.roll_number }}</td>
                  <td><small>{{ s.branch||'—' }}</small></td>
                  <td><strong>{{ s.cgpa }}</strong></td>
                  <td>{{ s.grad_year||'—' }}</td>
                  <td>
                    <span v-if="s.is_blacklisted" class="status-badge badge-rejected">blacklisted</span>
                    <span v-else-if="!s.is_active" class="status-badge badge-closed">inactive</span>
                    <span v-else class="status-badge badge-approved">active</span>
                  </td>
                  <td>
                    <button class="btn btn-sm" :class="s.is_blacklisted?'btn-outline-success':'btn-outline-danger'" @click="toggleBlacklist(s)">
                      <i class="bi" :class="s.is_blacklisted?'bi-unlock':'bi-slash-circle'"></i>
                      {{ s.is_blacklisted?'Unblacklist':'Blacklist' }}
                    </button>
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
  data:()=>({students:[],loading:true,search:"",branch:"",page:1,pages:1,total:0,_timer:null}),
  mounted(){ this.load(1); },
  methods:{
    debounceSearch(){ clearTimeout(this._timer); this._timer=setTimeout(()=>this.load(1),400); },
    async load(p=1){
      this.loading=true; this.page=p;
      try{
        const r=await Api.adminStudents({page:p,per_page:12,search:this.search,branch:this.branch});
        this.students=r.students; this.total=r.total; this.pages=r.pages;
      }catch(e){ this.$store.dispatch("toast",{message:"Failed to load students.",type:"error"}); }
      finally{ this.loading=false; }
    },
    async toggleBlacklist(s){
      try{
        await Api.updateStudent(s.id,{is_blacklisted:!s.is_blacklisted});
        this.$store.dispatch("toast",{message:`Student ${s.is_blacklisted?'un-blacklisted':'blacklisted'}.`});
        this.load(this.page);
      }catch(e){ this.$store.dispatch("toast",{message:e.message,type:"error"}); }
    },
  },
};
