/* ============================================================
   Maquinaria y Equipo de Construcción · Dashboard JS v2
   Navigation · Modals · Calendar · Forms · Notifications
   Animated counters · Progress ring · Microinteractions
   ============================================================ */
(function(){'use strict';

/* ─── View navigation ─── */
function switchView(viewId){
  const items=document.querySelectorAll('.db-nav__item[data-view]');
  const views=document.querySelectorAll('.db-view');
  const titleEl=document.querySelector('.db-tb__title');
  const subEl=document.querySelector('.db-tb__sub');
  const bnavItems=document.querySelectorAll('.db-bnav__item[data-view]');

  items.forEach(n=>n.classList.remove('is-active'));
  bnavItems.forEach(n=>n.classList.remove('is-active'));
  views.forEach(v=>v.classList.remove('is-active'));

  const activeItem=document.querySelector(`.db-nav__item[data-view="${viewId}"]`);
  if(activeItem){
    activeItem.classList.add('is-active');
    if(titleEl) titleEl.textContent=activeItem.dataset.title||activeItem.textContent.trim();
    if(subEl) subEl.textContent=activeItem.dataset.sub||'';
  }
  const activeBnav=document.querySelector(`.db-bnav__item[data-view="${viewId}"]`);
  if(activeBnav) activeBnav.classList.add('is-active');

  const target=document.getElementById('view-'+viewId);
  if(target){target.classList.add('is-active');triggerViewAnimations(target);}
  closeSidebar();
  window.scrollTo({top:0,behavior:'smooth'});
}

function initNav(){
  document.querySelectorAll('.db-nav__item[data-view]').forEach(item=>{
    item.addEventListener('click',()=>switchView(item.dataset.view));
  });
  document.querySelectorAll('.db-bnav__item[data-view]').forEach(item=>{
    item.addEventListener('click',()=>switchView(item.dataset.view));
  });
  /* trigger on initial active view */
  const first=document.querySelector('.db-view.is-active');
  if(first) triggerViewAnimations(first);
}

/* ─── Trigger per-view animations ─── */
function triggerViewAnimations(view){
  animateCounters(view);
  animateProgressRing(view);
  animateProgressBars(view);
}

/* ─── Animated stat counters ─── */
function animateCounters(scope){
  (scope||document).querySelectorAll('[data-count]').forEach(el=>{
    const target=parseFloat(el.dataset.count);
    const prefix=el.dataset.countPrefix||'';
    const suffix=el.dataset.countSuffix||'';
    const decimals=el.dataset.countDecimals?parseInt(el.dataset.countDecimals):0;
    const duration=700;
    const start=performance.now();
    function step(now){
      const p=Math.min((now-start)/duration,1);
      const ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
      const val=(target*ease).toFixed(decimals);
      el.textContent=prefix+val+suffix;
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ─── Progress ring ─── */
function animateProgressRing(scope){
  (scope||document).querySelectorAll('.db-prog-ring-fill[data-progress]').forEach(circle=>{
    const pct=parseFloat(circle.dataset.progress)||0;
    const r=parseFloat(circle.getAttribute('r'))||36;
    const circ=2*Math.PI*r;
    circle.style.strokeDasharray=circ;
    circle.style.strokeDashoffset=circ;
    setTimeout(()=>{
      circle.style.strokeDashoffset=circ-(circ*pct/100);
    },100);
    const label=circle.closest('.db-prog-ring-wrap')?.querySelector('.db-prog-ring-val');
    if(label&&label.dataset.count===undefined){
      label.dataset.count=pct;
      label.dataset.countSuffix='%';
      animateCounters(circle.closest('.db-prog-ring-wrap'));
    }
  });
}

/* ─── Progress bars ─── */
function animateProgressBars(scope){
  setTimeout(()=>{
    (scope||document).querySelectorAll('.db-prog__fill[data-w]').forEach(b=>{b.style.width=b.dataset.w+'%'});
    (scope||document).querySelectorAll('.db-prog-fill[data-w]').forEach(b=>{b.style.width=b.dataset.w+'%'});
  },200);
}

/* ─── Mobile sidebar ─── */
function closeSidebar(){
  const sb=document.querySelector('.db-sb');
  const ov=document.querySelector('.db-sb-overlay');
  if(sb) sb.classList.remove('is-open');
  if(ov) ov.classList.remove('is-open');
}
function initMobileSidebar(){
  const btn=document.querySelector('.db-tb__menu');
  const sb=document.querySelector('.db-sb');
  const ov=document.querySelector('.db-sb-overlay');
  if(!btn||!sb) return;
  btn.addEventListener('click',()=>{
    sb.classList.toggle('is-open');
    if(ov) ov.classList.toggle('is-open');
  });
  if(ov) ov.addEventListener('click',closeSidebar);
}

/* ─── Modals ─── */
function initModals(){
  document.querySelectorAll('[data-open]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const m=document.getElementById(btn.dataset.open);
      if(m) m.classList.add('is-open');
    });
  });
  document.querySelectorAll('[data-close]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const m=btn.closest('.db-overlay');
      if(m) m.classList.remove('is-open');
    });
  });
  document.querySelectorAll('.db-overlay').forEach(ov=>{
    ov.addEventListener('click',e=>{
      if(e.target===ov) ov.classList.remove('is-open');
    });
  });
}
window.openModal=id=>{const m=document.getElementById(id);if(m) m.classList.add('is-open')};
window.closeModal=id=>{const m=document.getElementById(id);if(m) m.classList.remove('is-open')};

/* ─── Notifications ─── */
function initNotif(){
  const btn=document.querySelector('.db-tb__notif');
  const panel=document.querySelector('.db-notif-panel');
  if(!btn||!panel) return;
  btn.addEventListener('click',e=>{e.stopPropagation();panel.classList.toggle('is-open')});
  document.addEventListener('click',e=>{
    if(!panel.contains(e.target)&&e.target!==btn) panel.classList.remove('is-open');
  });
  const clear=panel.querySelector('.db-notif-panel__clear');
  if(clear) clear.addEventListener('click',()=>{
    panel.querySelectorAll('.db-notif-item--unread').forEach(i=>i.classList.remove('db-notif-item--unread'));
    const dot=btn.querySelector('.db-tb__notif-dot');
    if(dot) dot.remove();
    showToast('Notificaciones marcadas como leídas','success');
  });
}

/* ─── Toast ─── */
function showToast(msg,type='info'){
  let wrap=document.querySelector('.db-toast-wrap');
  if(!wrap){wrap=document.createElement('div');wrap.className='db-toast-wrap';document.body.appendChild(wrap);}
  const icons={success:'fa-circle-check',error:'fa-circle-xmark',info:'fa-circle-info'};
  const t=document.createElement('div');
  t.className=`db-toast db-toast--${type}`;
  t.innerHTML=`<i class="fa-solid ${icons[type]||icons.info}"></i> ${msg}`;
  wrap.appendChild(t);
  setTimeout(()=>t.remove(),3200);
}
window.showToast=showToast;

/* ─── Filter buttons ─── */
function initFilters(){
  document.querySelectorAll('[data-filter-group]').forEach(group=>{
    const btns=group.querySelectorAll('.db-filter');
    btns.forEach(btn=>{
      btn.addEventListener('click',()=>{
        btns.forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const f=btn.dataset.filter;
        const listId=group.dataset.filterGroup;
        const list=listId?document.getElementById(listId):group.nextElementSibling;
        if(!list) return;
        list.querySelectorAll('[data-status]').forEach(item=>{
          item.style.display=(f==='all'||item.dataset.status===f)?'':'none';
        });
      });
    });
  });
}

/* ─── Fake form submit ─── */
function initForms(){
  document.querySelectorAll('[data-dash-form]').forEach(form=>{
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const btn=form.querySelector('button[type="submit"]');
      if(!btn) return;
      const prev=btn.innerHTML;
      btn.disabled=true;
      btn.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Guardando…';
      setTimeout(()=>{
        btn.innerHTML=prev;btn.disabled=false;
        const ov=form.closest('.db-overlay');
        if(ov) ov.classList.remove('is-open');
        showToast(form.dataset.msg||'Guardado correctamente','success');
      },950);
    });
  });
}

/* ─── Mini calendar ─── */
function initMiniCal(){
  const wrap=document.querySelector('[data-mini-cal]');
  if(!wrap) return;
  const monthEl=wrap.querySelector('.db-mini-cal__month');
  const gridEl=wrap.querySelector('.db-mini-cal__grid');
  const evs=window.calendarEvents||[];
  let cur=new Date();
  function render(){
    const y=cur.getFullYear(),m=cur.getMonth();
    const names=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    monthEl.textContent=names[m]+' '+y;
    gridEl.querySelectorAll('.db-mini-cal__day').forEach(d=>d.remove());
    const first=new Date(y,m,1),last=new Date(y,m+1,0),today=new Date();
    let sd=first.getDay();
    for(let i=0;i<sd;i++){const c=document.createElement('div');c.className='db-mini-cal__day db-mini-cal__day--other';c.textContent=new Date(y,m,0).getDate()-sd+1+i;gridEl.appendChild(c);}
    for(let d=1;d<=last.getDate();d++){
      const c=document.createElement('div');c.className='db-mini-cal__day';c.textContent=d;
      if(d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear()) c.classList.add('db-mini-cal__day--today');
      const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if(evs.some(ev=>ev.date===ds)) c.classList.add('db-mini-cal__day--event');
      gridEl.appendChild(c);
    }
    const total=sd+last.getDate(),rem=total%7===0?0:7-(total%7);
    for(let i=1;i<=rem;i++){const c=document.createElement('div');c.className='db-mini-cal__day db-mini-cal__day--other';c.textContent=i;gridEl.appendChild(c);}
  }
  render();
  const prev=wrap.querySelector('[data-cal-prev]'),next=wrap.querySelector('[data-cal-next]');
  if(prev) prev.addEventListener('click',()=>{cur=new Date(cur.getFullYear(),cur.getMonth()-1,1);render()});
  if(next) next.addEventListener('click',()=>{cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);render()});
}

/* ─── Full calendar ─── */
function initFullCal(){
  const wrap=document.querySelector('[data-full-cal]');
  if(!wrap) return;
  const monthEl=wrap.querySelector('.db-cal-full__month');
  const gridEl=wrap.querySelector('.db-cal-full__grid');
  const evs=window.calendarEvents||[];
  let cur=new Date();
  function render(){
    const y=cur.getFullYear(),m=cur.getMonth();
    const names=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    monthEl.textContent=names[m]+' '+y;
    gridEl.querySelectorAll('.db-cal-full__day,.db-cal-full__day--other').forEach(d=>d.remove());
    const first=new Date(y,m,1),last=new Date(y,m+1,0),today=new Date();
    let sd=first.getDay();
    for(let i=0;i<sd;i++){
      const c=document.createElement('div');c.className='db-cal-full__day db-cal-full__day--other';
      c.innerHTML=`<div class="db-cal-full__day-num">${new Date(y,m,0).getDate()-sd+1+i}</div>`;gridEl.appendChild(c);
    }
    for(let d=1;d<=last.getDate();d++){
      const c=document.createElement('div');c.className='db-cal-full__day';
      if(d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear()) c.classList.add('db-cal-full__day--today');
      const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      let html=`<div class="db-cal-full__day-num">${d}</div>`;
      evs.filter(ev=>ev.date===ds).forEach(ev=>{html+=`<div class="db-cal-full__ev db-cal-full__ev--${ev.type}">${ev.title}</div>`;});
      c.innerHTML=html;gridEl.appendChild(c);
    }
    const total=sd+last.getDate(),rem=total%7===0?0:7-(total%7);
    for(let i=1;i<=rem;i++){const c=document.createElement('div');c.className='db-cal-full__day db-cal-full__day--other';c.innerHTML=`<div class="db-cal-full__day-num">${i}</div>`;gridEl.appendChild(c);}
  }
  render();
  const prev=wrap.querySelector('[data-cal-prev]'),next=wrap.querySelector('[data-cal-next]');
  if(prev) prev.addEventListener('click',()=>{cur=new Date(cur.getFullYear(),cur.getMonth()-1,1);render()});
  if(next) next.addEventListener('click',()=>{cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);render()});
}

/* ─── File upload ─── */
function initUpload(){
  document.querySelectorAll('.db-upload').forEach(area=>{
    area.addEventListener('dragover',e=>{e.preventDefault();area.classList.add('is-drag')});
    area.addEventListener('dragleave',()=>area.classList.remove('is-drag'));
    area.addEventListener('drop',e=>{
      e.preventDefault();area.classList.remove('is-drag');
      const f=e.dataTransfer.files[0];
      if(f){area.innerHTML=`<i class="fa-solid fa-file-check" style="color:var(--success)"></i><p>${f.name}</p><span>${(f.size/1024).toFixed(1)} KB</span>`;area.style.borderColor='var(--success)';}
    });
    area.addEventListener('click',()=>{
      const inp=document.createElement('input');inp.type='file';
      inp.onchange=()=>{const f=inp.files[0];if(f){area.innerHTML=`<i class="fa-solid fa-file-check" style="color:var(--success)"></i><p>${f.name}</p><span>${(f.size/1024).toFixed(1)} KB</span>`;area.style.borderColor='var(--success)';}};
      inp.click();
    });
  });
}

/* ─── Quick action cards → open modal ─── */
function initQacts(){
  document.querySelectorAll('.db-qact[data-open]').forEach(card=>{
    card.addEventListener('click',()=>{
      const m=document.getElementById(card.dataset.open);
      if(m) m.classList.add('is-open');
    });
  });
}

/* ─── Task row click (student) → open submission modal ─── */
function initTaskClick(){
  document.querySelectorAll('[data-task-open]').forEach(row=>{
    row.addEventListener('click',()=>{
      const id=row.dataset.taskOpen;
      const name=row.querySelector('.db-task__name,.db-tbl-name')?.textContent||'Tarea';
      const titleEl=document.getElementById('submit-task-title');
      if(titleEl) titleEl.textContent=name;
      openModal(id||'modal-submit');
    });
  });
}

/* ─── Submission table (teacher): mark reviewed ─── */
function initReview(){
  document.querySelectorAll('[data-review-btn]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const row=btn.closest('tr');
      if(row){
        const badge=row.querySelector('.db-badge--pending');
        if(badge){badge.className='db-badge db-badge--done';badge.innerHTML='<i class="fa-solid fa-check"></i> Revisada';}
        btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-check"></i>';
        showToast('Entrega marcada como revisada','success');
      }
    });
  });
}

/* ─── Announce delete (teacher) ─── */
function initAnnDelete(){
  document.querySelectorAll('[data-ann-delete]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const card=btn.closest('.db-ann,.db-ann-full');
      if(card&&confirm('¿Eliminar este anuncio?')){
        card.style.opacity='0';card.style.transition='opacity .3s';
        setTimeout(()=>card.remove(),300);
        showToast('Anuncio eliminado','info');
      }
    });
  });
}

/* ─── Resource delete (teacher) ─── */
function initResDelete(){
  document.querySelectorAll('[data-res-delete]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const row=btn.closest('.db-res-row');
      if(row&&confirm('¿Eliminar este recurso?')){
        row.style.opacity='0';row.style.transition='opacity .3s';
        setTimeout(()=>row.remove(),300);
        showToast('Recurso eliminado','info');
      }
    });
  });
}

/* ─── Global section management (teacher dashboard) ─── */
window.currentSection='A';
const SEC_EVENTS={
  A:[
    {date:'2026-04-22',title:'Examen Parcial I',type:'exam'},
    {date:'2026-04-25',title:'Entrega Informe U3',type:'task'},
    {date:'2026-04-28',title:'Exposición Grupal',type:'expo'},
    {date:'2026-05-02',title:'Cierre Unidad 3',type:'class'},
    {date:'2026-05-12',title:'Práctica de Campo',type:'class'},
    {date:'2026-05-15',title:'Examen Parcial II',type:'exam'},
    {date:'2026-06-05',title:'Entrega Proyecto Final',type:'task'}
  ],
  B:[
    {date:'2026-04-21',title:'Práctica 4 · Ciclos',type:'class'},
    {date:'2026-04-24',title:'Entrega Informe JTP P3',type:'task'},
    {date:'2026-04-28',title:'Práctica 5 · Compactación',type:'class'},
    {date:'2026-05-05',title:'Entrega Memoria JTP',type:'task'},
    {date:'2026-05-12',title:'Visita a Obra · JTP',type:'class'},
    {date:'2026-05-19',title:'Examen JTP Final',type:'exam'},
    {date:'2026-06-02',title:'Entrega Proyecto JTP',type:'task'}
  ]
};
function setGlobalSection(sec){
  window.currentSection=sec;
  // Section card buttons in welcome banner + any [data-switch-sec] elements
  document.querySelectorAll('[data-switch-sec]').forEach(b=>{
    b.classList.toggle('is-active',b.dataset.switchSec===sec);
  });
  // Check icons inside section cards
  const chkA=document.getElementById('sec-check-A');
  const chkB=document.getElementById('sec-check-B');
  if(chkA) chkA.innerHTML=sec==='A'?'<i class="fa-solid fa-circle-check"></i>':'<i class="fa-solid fa-circle"></i>';
  if(chkB) chkB.innerHTML=sec==='B'?'<i class="fa-solid fa-circle-check"></i>':'<i class="fa-solid fa-circle"></i>';
  // Show / hide section content blocks
  document.querySelectorAll('.db-sec-content[data-sec]').forEach(el=>{
    el.style.display=el.dataset.sec===sec?'':'none';
  });
  // Update [data-sec-label] text everywhere
  const names={A:'Sección A — Teoría',B:'Sección B — JTP / Práctica'};
  const shortNames={A:'Sec. A — Teoría',B:'Sec. B — JTP'};
  document.querySelectorAll('[data-sec-label]').forEach(el=>{
    el.textContent=(el.closest('.db-sb')?shortNames[sec]:names[sec])||'Sección '+sec;
  });
  // Update topbar subtitle
  const sub=document.querySelector('.db-tb__sub');
  if(sub) sub.textContent='CIV 247 · '+(shortNames[sec]||'Sec. '+sec)+' · Semestre I 2026';
  // Update calendar events and re-render
  if(SEC_EVENTS[sec]) window.calendarEvents=SEC_EVENTS[sec];
  try{
    document.querySelectorAll('[data-cal-prev],[data-cal-next]').forEach(btn=>{
      const c=btn.cloneNode(true);if(btn.parentNode) btn.parentNode.replaceChild(c,btn);
    });
    if(typeof window.initMiniCal==='function') window.initMiniCal();
    if(typeof window.initFullCal==='function') window.initFullCal();
  }catch(e){}
  // Re-render attendance module
  if(window.AttT) try{ window.AttT.setSection(sec); }catch(e){}
  // Animate new stat counters
  document.querySelectorAll('.db-sec-content[data-sec="'+sec+'"] [data-count]').forEach(el=>{
    const target=parseFloat(el.dataset.count);
    const dur=600;const start=performance.now();
    const ease=p=>1-Math.pow(1-p,3);
    (function tick(now){
      const p=Math.min((now-start)/dur,1);
      el.textContent=Math.round(target*ease(p));
      if(p<1) requestAnimationFrame(tick);
    })(performance.now());
  });
  // Animate new progress bars
  setTimeout(()=>{
    document.querySelectorAll('.db-sec-content[data-sec="'+sec+'"] .db-prog__fill[data-w]').forEach(b=>{b.style.width=b.dataset.w+'%';});
  },150);
  showToast((names[sec]||sec)+' activa','info');
}
window.setGlobalSection=setGlobalSection;

/* ─── Publish toggle (teacher modal-subir-recurso) ─── */
function initPublishToggle(){
  document.querySelectorAll('[data-pub-toggle]').forEach(wrap=>{
    const btns=wrap.querySelectorAll('.db-pub-btn');
    const fields=document.getElementById('scheduled-fields');
    const submitBtn=document.getElementById('pub-submit-btn');
    btns.forEach(btn=>{
      btn.addEventListener('click',()=>{
        btns.forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const isScheduled=btn.dataset.pub==='scheduled';
        if(fields) fields.style.display=isScheduled?'grid':'none';
        if(submitBtn){
          submitBtn.innerHTML=isScheduled
            ?'<i class="fa-solid fa-clock"></i> Programar publicación'
            :'<i class="fa-solid fa-cloud-arrow-up"></i> Subir recurso';
        }
      });
    });
  });
}


/* ─── Scheduled resources: show badge on future publish dates ─── */
function initScheduledResources(){
  const now=new Date();
  document.querySelectorAll('[data-publish-date]').forEach(el=>{
    const d=new Date(el.dataset.publishDate);
    if(isNaN(d.getTime())) return;
    if(d>now){
      const badge=el.querySelector('.db-scheduled-badge');
      if(badge) badge.style.display='inline-flex';
      el.classList.add('is-scheduled');
    }
  });
}

// Expose calendar functions for section switching
window.initMiniCal=initMiniCal;
window.initFullCal=initFullCal;

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded',()=>{
  initNav();
  initMobileSidebar();
  initModals();
  initNotif();
  initForms();
  initFilters();
  initMiniCal();
  initFullCal();
  initUpload();
  initQacts();
  initTaskClick();
  initReview();
  initAnnDelete();
  initResDelete();
  initPublishToggle();
  initScheduledResources();
  // Global section switcher (topbar pills + sidebar items)
  document.querySelectorAll('[data-switch-sec]').forEach(btn=>{
    btn.addEventListener('click',()=>setGlobalSection(btn.dataset.switchSec));
  });
  document.querySelectorAll('.db-sb__sec[data-section]').forEach(btn=>{
    btn.addEventListener('click',()=>setGlobalSection(btn.dataset.section));
  });
});

})();
