const AdminDashboard = {
  template:`
    <div class="page-layout">
      <div class="ppa-sidebar">
        <ul class="nav flex-column">
          <li class="nav-item"><router-link class="nav-link" to="/admin"><i class="bi bi-speedometer2"></i>Dashboard</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/admin/companies"><i class="bi bi-building"></i>Companies</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/admin/students"><i class="bi bi-people"></i>Students</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/admin/drives"><i class="bi bi-briefcase"></i>Drives</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/admin/applications"><i class="bi bi-file-earmark-text"></i>Applications</router-link></li>
        </ul>
      </div>
      <div class="ppa-content">
        <div class="section-title"><i class="bi bi-speedometer2"></i>Admin Dashboard</div>
        <loading-spinner v-if="loading"></loading-spinner>
        <template v-else>
          <div class="row g-3 mb-4">
            <div class="col-6 col-md-3" v-for="s in statCards" :key="s.label">
              <div class="stat-card">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div class="stat-value">{{ stats[s.key] ?? '—' }}</div>
                    <div class="stat-label">{{ s.label }}</div>
                  </div>
                  <div class="stat-icon" :style="'background:'+s.bg">
                    <i class="bi" :class="s.icon" :style="'color:'+s.color"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="row g-3">
            <div class="col-md-6">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white fw-semibold">Application Status Breakdown</div>
                <div class="card-body"><canvas id="appChart" height="200"></canvas></div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white fw-semibold">Drive Status Overview</div>
                <div class="card-body"><canvas id="driveChart" height="200"></canvas></div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>`,
  components: { "loading-spinner": LoadingSpinner },
  data:() => ({ stats:{}, loading:true }),
  computed:{
    statCards(){
      return [
        {key:"total_students",    label:"Students",          icon:"bi-people-fill",     bg:"#dbeafe", color:"#1e40af"},
        {key:"total_companies",   label:"Companies",         icon:"bi-building-fill",   bg:"#d1fae5", color:"#065f46"},
        {key:"approved_drives",   label:"Active Drives",     icon:"bi-briefcase-fill",  bg:"#ede9fe", color:"#5b21b6"},
        {key:"selected_students", label:"Students Placed",   icon:"bi-trophy-fill",     bg:"#fef9c3", color:"#92400e"},
        {key:"total_applications",label:"Total Applications",icon:"bi-file-text-fill",  bg:"#fce7f3", color:"#9d174d"},
        {key:"pending_companies", label:"Pending Approvals", icon:"bi-hourglass-split", bg:"#fff7ed", color:"#c2410c"},
        {key:"pending_drives",    label:"Drives Pending",    icon:"bi-clock-fill",      bg:"#ecfdf5", color:"#059669"},
        {key:"approved_companies",label:"Active Companies",  icon:"bi-patch-check-fill",bg:"#e0f2fe", color:"#0369a1"},
      ];
    },
  },
  async mounted(){
    try{
      this.stats = await Api.adminStats();
      this.$nextTick(()=>this.renderCharts());
    }catch(e){ this.$store.dispatch("toast",{message:"Failed to load stats.",type:"error"}); }
    finally{ this.loading=false; }
  },
  methods:{
    renderCharts(){
      const s = this.stats;
      new Chart(document.getElementById("appChart"),{
        type:"doughnut",
        data:{
          labels:["Applied","Shortlisted","Selected","Rejected"],
          datasets:[{data:[
            (s.total_applications||0)-(s.selected_students||0)-(s.students_shortlisted||0),
            s.students_shortlisted||0, s.selected_students||0,0
          ], backgroundColor:["#60a5fa","#a78bfa","#34d399","#f87171"], borderWidth:0}]
        },
        options:{plugins:{legend:{position:"bottom"}},cutout:"65%"}
      });
      new Chart(document.getElementById("driveChart"),{
        type:"bar",
        data:{
          labels:["Pending","Approved","Closed"],
          datasets:[{label:"Drives",
            data:[s.pending_drives||0, s.approved_drives||0, (s.total_drives||0)-(s.pending_drives||0)-(s.approved_drives||0)],
            backgroundColor:["#fbbf24","#34d399","#9ca3af"], borderRadius:6}]
        },
        options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}
      });
    },
  },
};
