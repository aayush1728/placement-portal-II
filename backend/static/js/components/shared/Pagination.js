const PaginationBar = {
  props:["total","pages","current"], emits:["change"],
  template:`
    <nav v-if="pages>1" class="mt-3 d-flex justify-content-between align-items-center">
      <small class="text-muted">{{ total }} result{{ total!==1?'s':'' }}</small>
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item" :class="{disabled:current<=1}">
          <a class="page-link" href="#" @click.prevent="$emit('change',current-1)"><i class="bi bi-chevron-left"></i></a>
        </li>
        <li v-for="p in pages" :key="p" class="page-item" :class="{active:p===current}">
          <a class="page-link" href="#" @click.prevent="$emit('change',p)">{{p}}</a>
        </li>
        <li class="page-item" :class="{disabled:current>=pages}">
          <a class="page-link" href="#" @click.prevent="$emit('change',current+1)"><i class="bi bi-chevron-right"></i></a>
        </li>
      </ul>
    </nav>`,
};
