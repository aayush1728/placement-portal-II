const ToastContainer = {
  template: `
    <div class="ppa-toast-container">
      <div v-for="t in $store.state.toasts" :key="t.id" class="ppa-toast"
           :class="t.type==='error'?'bg-danger text-white':t.type==='warning'?'bg-warning':'bg-success text-white'">
        <i class="bi" :class="t.type==='error'?'bi-x-circle-fill':t.type==='warning'?'bi-exclamation-triangle-fill':'bi-check-circle-fill'"></i>
        <span>{{ t.message }}</span>
        <button class="btn-close btn-close-white ms-auto" style="font-size:.7rem" @click="$store.commit('REMOVE_TOAST',t.id)"></button>
      </div>
    </div>`,
};
