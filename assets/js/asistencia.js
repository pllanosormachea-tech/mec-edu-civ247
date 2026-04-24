/* ============================================================
   Maquinaria y Equipo de Construcción · Módulo de Asistencia v2
   Motor de datos · UI Docente (por sección) · UI Estudiante
   ============================================================ */
(function(){'use strict';

/* ─── Constantes ─────────────────────────────────────────────── */
const K={SES:'mec_att_ses2',RESP:'mec_att_resp2',POL:'mec_att_pol2',STU:'mec_att_stu2',VER:'mec_att_v'};
const SEED_VER='3';

const SS={
  OPEN:'open',CLOSED:'closed',VALIDATED:'validated',
  PARTIAL:'partially_invalidated',INVALID:'fully_invalidated'
};
const RS={
  PRESENT:'present_reported',ABSENT:'absent_reported',
  JUST_PENDING:'justification_pending',JUST_OK:'justification_accepted',
  JUST_NO:'justification_rejected',VALIDATED:'attendance_validated',
  INVALIDATED:'attendance_invalidated',SUSPICIOUS:'suspicious'
};
window.SS=SS; window.RS=RS;

/* ─── Storage ────────────────────────────────────────────────── */
const DB={
  get(k){try{return JSON.parse(localStorage.getItem(k))||[];}catch{return [];}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v));},
  str(k){return localStorage.getItem(k);},
  setStr(k,v){localStorage.setItem(k,v);}
};

/* ─── Seed con separación real de secciones ──────────────────── */
function seedData(){
  if(DB.str(K.VER)===SEED_VER) return;

  const D=86400000, now=Date.now();

  // Estudiantes con secciones claras
  DB.set(K.STU,[
    {id:'stu_1',name:'Carlos Reinaga',code:'2024-05678',sections:['A','B']},
    {id:'stu_2',name:'María Quispe Alarcón',code:'2024-05679',sections:['A']},
    {id:'stu_3',name:'Juan Carlos Flores',code:'2024-05680',sections:['A','B']},
    {id:'stu_4',name:'Ana Condori Mamani',code:'2024-05681',sections:['B']},
    {id:'stu_5',name:'Pedro Mamani Rojas',code:'2024-05682',sections:['A']},
    {id:'stu_6',name:'Lucía Vargas Copa',code:'2024-05683',sections:['A','B']},
    {id:'stu_7',name:'Diego Rocha Tórrez',code:'2024-05684',sections:['A']},
    {id:'stu_8',name:'Sofía Limachi Paco',code:'2024-05685',sections:['B']}
  ]);

  // Política por sección: A y B tienen sus propias reglas
  DB.set(K.POL,[
    {id:'pol_A',course_id:'civ247',section:'A',
     course_name:'Maquinaria y Equipos — Teoría',
     max_absences:4,max_justifications:2,
     warning_threshold:2,risk_threshold:3,fail_threshold:4},
    {id:'pol_B',course_id:'civ247',section:'B',
     course_name:'Maquinaria y Equipos — JTP / Práctica',
     max_absences:3,max_justifications:1,
     warning_threshold:1,risk_threshold:2,fail_threshold:3}
  ]);

  // Sesiones: algunas de A, algunas de B, algunas de ambas
  DB.set(K.SES,[
    {id:'ses_001',course_id:'civ247',teacher_id:'tch_1',
     label:'Clase 7 — Ciclos de Trabajo (intro)',
     date:'2026-04-10',start_time:'08:00',duration_minutes:15,
     status:SS.VALIDATED,sections:['A','B'],
     note:'Unidad 3 · presentación del tema',
     allow_justifications:true,auto_close:true,expected_present:11,
     created_at:now-12*D,closed_at:now-12*D+15*60e3,validated_at:now-12*D+30*60e3,
     invalidation_reason:null},
    {id:'ses_002',course_id:'civ247',teacher_id:'tch_1',
     label:'Clase 8 — Rendimientos de Maquinaria',
     date:'2026-04-14',start_time:'08:00',duration_minutes:15,
     status:SS.VALIDATED,sections:['A'],
     note:'Solo Sección A — Teoría',
     allow_justifications:true,auto_close:true,expected_present:6,
     created_at:now-8*D,closed_at:now-8*D+15*60e3,validated_at:now-8*D+25*60e3,
     invalidation_reason:null},
    {id:'ses_003',course_id:'civ247',teacher_id:'tch_1',
     label:'Práctica 3 — Visita a Obra Civil',
     date:'2026-04-16',start_time:'07:30',duration_minutes:20,
     status:SS.VALIDATED,sections:['B'],
     note:'Solo Sección B — JTP. Llevar EPP.',
     allow_justifications:false,auto_close:true,expected_present:5,
     created_at:now-6*D,closed_at:now-6*D+20*60e3,validated_at:now-6*D+35*60e3,
     invalidation_reason:null},
    {id:'ses_004',course_id:'civ247',teacher_id:'tch_1',
     label:'Clase 9 — Formulario de Rendimientos',
     date:'2026-04-21',start_time:'08:00',duration_minutes:15,
     status:SS.CLOSED,sections:['A'],
     note:'',allow_justifications:true,auto_close:true,expected_present:6,
     created_at:now-1*D,closed_at:now-1*D+15*60e3,validated_at:null,
     invalidation_reason:null},
    {id:'ses_005',course_id:'civ247',teacher_id:'tch_1',
     label:'Práctica 4 — Cálculo de Ciclos',
     date:'2026-04-21',start_time:'14:00',duration_minutes:20,
     status:SS.CLOSED,sections:['B'],
     note:'',allow_justifications:true,auto_close:true,expected_present:5,
     created_at:now-1*D+5*3600e3,closed_at:now-1*D+5*3600e3+20*60e3,validated_at:null,
     invalidation_reason:null}
  ]);

  const stus=DB.get(K.STU);
  const secA=stus.filter(s=>s.sections.includes('A'));
  const secB=stus.filter(s=>s.sections.includes('B'));
  const resps=[];

  // ses_001 (A+B): todos presentes excepto stu_4 (Ana, sec B) ausente con just aceptada
  [...secA,...secB.filter(s=>!secA.includes(s))].forEach((s,i)=>{
    const absent=s.id==='stu_4';
    resps.push({
      id:`r001_${s.id}`,session_id:'ses_001',student_id:s.id,
      student_name:s.name,student_code:s.code,
      reported_status:absent?'absent':'present',
      note:absent?'Cita médica urgente en el SESMI':'',
      submitted_at:now-12*D+2*60e3+i*45e3,
      review_status:absent?RS.JUST_OK:RS.VALIDATED,
      teacher_observation:absent?'Justificación válida, documento presentado':null,
      reviewed_at:now-12*D+25*60e3,reviewed_by:'tch_1'
    });
  });

  // ses_002 (A only): Pedro ausente, justificación rechazada
  secA.forEach((s,i)=>{
    const absent=s.id==='stu_5';
    resps.push({
      id:`r002_${s.id}`,session_id:'ses_002',student_id:s.id,
      student_name:s.name,student_code:s.code,
      reported_status:absent?'absent':'present',
      note:absent?'Problema de transporte':'',
      submitted_at:now-8*D+3*60e3+i*60e3,
      review_status:absent?RS.JUST_NO:RS.VALIDATED,
      teacher_observation:absent?'No aplica como justificación válida':null,
      reviewed_at:now-8*D+20*60e3,reviewed_by:'tch_1'
    });
  });

  // ses_003 (B only): todos presentes excepto stu_8 (Sofía) sin responder
  secB.filter(s=>s.id!=='stu_8').forEach((s,i)=>{
    resps.push({
      id:`r003_${s.id}`,session_id:'ses_003',student_id:s.id,
      student_name:s.name,student_code:s.code,
      reported_status:'present',note:'',
      submitted_at:now-6*D+4*60e3+i*70e3,
      review_status:RS.VALIDATED,
      teacher_observation:null,reviewed_at:now-6*D+30*60e3,reviewed_by:'tch_1'
    });
  });

  // ses_004 (A only): 5/6 respondieron, Diego ausente con just pendiente
  secA.slice(0,5).forEach((s,i)=>{
    const absent=s.id==='stu_7';
    resps.push({
      id:`r004_${s.id}`,session_id:'ses_004',student_id:s.id,
      student_name:s.name,student_code:s.code,
      reported_status:absent?'absent':'present',
      note:absent?'No pude llegar a tiempo':'',
      submitted_at:now-1*D+60e3+i*80e3,
      review_status:absent?RS.JUST_PENDING:RS.PRESENT,
      teacher_observation:null,reviewed_at:null,reviewed_by:null
    });
  });

  // ses_005 (B only): 4/5 respondieron, Ana ausente con just pendiente
  secB.slice(0,4).forEach((s,i)=>{
    const absent=s.id==='stu_4';
    resps.push({
      id:`r005_${s.id}`,session_id:'ses_005',student_id:s.id,
      student_name:s.name,student_code:s.code,
      reported_status:absent?'absent':'present',
      note:absent?'Tuve que entregar un trabajo en otro departamento':'',
      submitted_at:now-1*D+5*3600e3+90e3+i*90e3,
      review_status:absent?RS.JUST_PENDING:RS.PRESENT,
      teacher_observation:null,reviewed_at:null,reviewed_by:null
    });
  });

  DB.set(K.RESP,resps);
  DB.setStr(K.VER,SEED_VER);
}

/* ─── Motor de datos ─────────────────────────────────────────── */
const Engine={
  sessions(){return DB.get(K.SES);},
  responses(){return DB.get(K.RESP);},
  students(){return DB.get(K.STU);},
  policies(){return DB.get(K.POL);},

  policy(section){
    return this.policies().find(p=>p.section===section)||
      {max_absences:4,max_justifications:2,warning_threshold:2,risk_threshold:3,fail_threshold:4};
  },

  savePolicy(p){
    const list=this.policies();
    const i=list.findIndex(x=>x.id===p.id);
    if(i>=0) list[i]=p; else list.push(p);
    DB.set(K.POL,list);
  },

  studentsForSection(sec){
    if(!sec) return this.students();
    return this.students().filter(s=>s.sections.includes(sec));
  },

  sessionsForSection(sec){
    if(!sec) return this.sessions();
    return this.sessions().filter(s=>!s.sections||s.sections.includes(sec));
  },

  createSession(data){
    const list=this.sessions();
    const ses={id:'ses_'+Date.now(),...data,
      status:SS.OPEN,created_at:Date.now(),
      closed_at:null,validated_at:null,invalidation_reason:null};
    list.unshift(ses);
    DB.set(K.SES,list);
    return ses;
  },

  closeSession(id){
    const list=this.sessions();
    const i=list.findIndex(s=>s.id===id);
    if(i<0) return false;
    list[i].status=SS.CLOSED; list[i].closed_at=Date.now();
    DB.set(K.SES,list); return true;
  },

  validateSession(id){
    const list=this.sessions();
    const i=list.findIndex(s=>s.id===id);
    if(i<0) return false;
    list[i].status=SS.VALIDATED; list[i].validated_at=Date.now();
    DB.set(K.SES,list);
    const resps=this.responses();
    resps.forEach(r=>{ if(r.session_id===id&&r.review_status===RS.PRESENT) r.review_status=RS.VALIDATED; });
    DB.set(K.RESP,resps); return true;
  },

  invalidateSession(id,reason){
    const list=this.sessions();
    const i=list.findIndex(s=>s.id===id);
    if(i<0) return false;
    list[i].status=SS.INVALID; list[i].invalidation_reason=reason;
    DB.set(K.SES,list); return true;
  },

  submitResponse(sessionId,studentId,reportedStatus,note){
    const ses=this.sessions().find(s=>s.id===sessionId);
    if(!ses||ses.status!==SS.OPEN) return{ok:false,error:'La sesión no está disponible'};
    const resps=this.responses();
    if(resps.some(r=>r.session_id===sessionId&&r.student_id===studentId))
      return{ok:false,error:'Ya enviaste tu respuesta para esta sesión'};
    const stu=this.students().find(s=>s.id===studentId)||{};
    const rs=reportedStatus==='present'?RS.PRESENT:note?RS.JUST_PENDING:RS.ABSENT;
    const resp={
      id:'resp_'+Date.now(),session_id:sessionId,student_id:studentId,
      student_name:stu.name||'Estudiante',student_code:stu.code||'',
      reported_status:reportedStatus,note:note||'',submitted_at:Date.now(),
      review_status:rs,teacher_observation:null,reviewed_at:null,reviewed_by:null
    };
    resps.push(resp); DB.set(K.RESP,resps); return{ok:true,resp};
  },

  reviewResponse(respId,action,observation){
    const resps=this.responses();
    const i=resps.findIndex(r=>r.id===respId);
    if(i<0) return false;
    const map={validate:RS.VALIDATED,invalidate:RS.INVALIDATED,
      suspicious:RS.SUSPICIOUS,accept_justification:RS.JUST_OK,
      reject_justification:RS.JUST_NO};
    if(map[action]) resps[i].review_status=map[action];
    if(observation) resps[i].teacher_observation=observation;
    resps[i].reviewed_at=Date.now(); resps[i].reviewed_by='tch_1';
    DB.set(K.RESP,resps); return true;
  },

  sessionSummary(sessionId,sectionFilter){
    const ses=this.sessions().find(s=>s.id===sessionId);
    if(!ses) return null;
    const allResps=this.responses().filter(r=>r.session_id===sessionId);
    // Only count students for the section(s) of this session
    const sections=ses.sections||['A','B'];
    const enrolled=this.students().filter(s=>sections.some(sec=>s.sections.includes(sec)));
    // Remove duplicates (students in both sections)
    const uniqueEnrolled=[...new Map(enrolled.map(s=>[s.id,s])).values()];
    const resps=sectionFilter
      ? allResps.filter(r=>{ const stu=this.students().find(x=>x.id===r.student_id); return stu?.sections.includes(sectionFilter); })
      : allResps;
    const enrolledFiltered=sectionFilter
      ? this.studentsForSection(sectionFilter).filter(s=>sections.includes(sectionFilter)||sections.some(x=>s.sections.includes(x)))
      : uniqueEnrolled;
    return{
      session:ses,
      totalEnrolled:enrolledFiltered.length,
      totalResponded:resps.length,
      presentReported:resps.filter(r=>r.reported_status==='present').length,
      absentReported:resps.filter(r=>r.reported_status==='absent').length,
      withJustification:resps.filter(r=>r.reported_status==='absent'&&r.note).length,
      justPending:resps.filter(r=>r.review_status===RS.JUST_PENDING).length,
      notResponded:enrolledFiltered.length-resps.length,
      suspicious:resps.filter(r=>r.review_status===RS.SUSPICIOUS).length,
      responses:resps,
      enrolledStudents:enrolledFiltered
    };
  },

  studentSummary(studentId,section){
    const stu=this.students().find(s=>s.id===studentId);
    const stuSections=stu?.sections||['A'];
    // Only look at sessions for this student's section
    const relevantSec=section||(stuSections[0]);
    const sessions=this.sessions().filter(s=>
      s.sections&&s.sections.includes(relevantSec)&&
      [SS.VALIDATED,SS.CLOSED,SS.PARTIAL].includes(s.status)
    );
    const resps=this.responses().filter(r=>r.student_id===studentId);
    const pol=this.policy(relevantSec);
    let absences=0,justSent=0,justOk=0,justNo=0;

    const history=sessions.map(ses=>{
      const r=resps.find(x=>x.session_id===ses.id);
      if(!r){
        if(ses.status===SS.VALIDATED) absences++;
        return{session:ses,response:null};
      }
      if(r.reported_status==='absent'){
        if(r.review_status!==RS.JUST_OK) absences++;
        if(r.note) justSent++;
        if(r.review_status===RS.JUST_OK) justOk++;
        if(r.review_status===RS.JUST_NO) justNo++;
      }
      return{session:ses,response:r};
    });

    const total=sessions.length;
    const rate=total>0?Math.round(((total-absences)/total)*100):100;
    const alerts=[];
    if(absences>=pol.fail_threshold)
      alerts.push({type:'fail',msg:`Perdiste la materia por inasistencia (${absences} de ${pol.fail_threshold} faltas)`});
    else if(absences>=pol.risk_threshold)
      alerts.push({type:'risk',msg:`Estás en riesgo académico — ${absences} faltas de ${pol.fail_threshold} permitidas`});
    else if(absences>=pol.warning_threshold)
      alerts.push({type:'warning',msg:`Tienes ${absences} faltas acumuladas — límite: ${pol.fail_threshold}`});

    const remJust=Math.max(0,pol.max_justifications-justOk);
    if(remJust===1&&pol.max_justifications>0)
      alerts.push({type:'warning',msg:'Te queda solo 1 justificación disponible'});
    else if(remJust===0&&justSent>0)
      alerts.push({type:'risk',msg:'Agotaste el límite de justificaciones aceptadas'});

    return{studentId,section:relevantSec,policy:pol,
      totalSessions:total,absences,attendanceRate:rate,
      justSent,justOk,justNo,remainingJust:remJust,alerts,history};
  },

  openSessionForStudent(studentId){
    const resps=this.responses();
    const stu=this.students().find(s=>s.id===studentId);
    return this.sessions().find(s=>{
      if(s.status!==SS.OPEN) return false;
      if(stu&&s.sections&&!s.sections.some(sec=>stu.sections.includes(sec))) return false;
      return!resps.some(r=>r.session_id===s.id&&r.student_id===studentId);
    })||null;
  },

  timeRemaining(ses){
    if(!ses||ses.status!==SS.OPEN) return 0;
    return Math.max(0,ses.created_at+ses.duration_minutes*60e3-Date.now());
  },

  checkAutoClose(){
    const list=this.sessions();
    let changed=false;
    list.forEach(s=>{
      if(s.status===SS.OPEN&&s.auto_close&&this.timeRemaining(s)<=0){
        s.status=SS.CLOSED; s.closed_at=s.created_at+s.duration_minutes*60e3; changed=true;
      }
    });
    if(changed) DB.set(K.SES,list);
    return changed;
  }
};
window.AttendanceEngine=Engine;

/* ─── Utilidades ─────────────────────────────────────────────── */
function fmtTimer(ms){const m=Math.floor(ms/60e3),s=Math.floor((ms%60e3)/1e3);return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function fmtTime(d){return new Date(d).toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'});}
function fmtDateTime(d){return new Date(d).toLocaleString('es-BO',{dateStyle:'short',timeStyle:'short'});}
function el(id){return document.getElementById(id);}
function setText(id,v){const e=el(id);if(e)e.textContent=v;}

function sesStatusBadge(status){
  const m={[SS.OPEN]:['open','Abierta'],[SS.CLOSED]:['closed','Pend. revisión'],
    [SS.VALIDATED]:['validated','Validada'],[SS.PARTIAL]:['partial','Parcial'],
    [SS.INVALID]:['invalid','Invalidada']};
  const[k,lbl]=m[status]||['pending','Borrador'];
  return`<span class="att-badge att-badge--${k}">${lbl}</span>`;
}
function respStatusBadge(rs){
  const m={[RS.PRESENT]:['pending','Pend. revisión'],[RS.ABSENT]:['absent','Ausente'],
    [RS.JUST_PENDING]:['just-pending','Just. pendiente'],[RS.JUST_OK]:['just-ok','Just. aceptada'],
    [RS.JUST_NO]:['just-no','Just. rechazada'],[RS.VALIDATED]:['validated','Validado'],
    [RS.INVALIDATED]:['invalid','Invalidado'],[RS.SUSPICIOUS]:['suspicious','Sospechoso']};
  const[k,lbl]=m[rs]||['pending','Pendiente'];
  return`<span class="att-badge att-badge--${k}">${lbl}</span>`;
}

/* ═══════════════════════════════════════════════════════════════
   MÓDULO DOCENTE
══════════════════════════════════════════════════════════════ */
const AttT={
  currentSection:'A',

  init(){
    if(!el('att-teacher-module')) return;
    this.bindSectionBtns();
    this.bindOpenForm();
    this.bindViewTabs();
    this.bindPolicyForm();
    this.render();
    setInterval(()=>{
      if(Engine.checkAutoClose()){
        this.render();
        showToast('Una sesión se cerró automáticamente','info');
      }
    },5000);
  },

  /* Selector de sección (en la vista Y en el sidebar) */
  bindSectionBtns(){
    const activate=sec=>{
      this.currentSection=sec;
      document.querySelectorAll('[data-att-sec]').forEach(b=>b.classList.toggle('is-active',b.dataset.attSec===sec));
      document.querySelectorAll('.db-sb__sec[data-section]').forEach(b=>b.classList.toggle('is-active',b.dataset.section===sec));
      const names={A:'Sección A — Teoría',B:'Sección B — JTP'};
      const subs={A:'Teoría · CIV 247 · Semestre I 2026',B:'JTP / Práctica · CIV 247 · Semestre I 2026'};
      setText('att-view-title','Control de Asistencia — '+(names[sec]||'Sección '+sec));
      setText('att-view-sub',subs[sec]||'');
      this.render();
    };
    document.querySelectorAll('[data-att-sec]').forEach(btn=>{
      btn.addEventListener('click',()=>activate(btn.dataset.attSec));
    });
    document.querySelectorAll('.db-sb__sec[data-section]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        activate(btn.dataset.section);
        const info=btn.querySelector('.db-sb__sec-info strong')?.textContent||'Sección '+btn.dataset.section;
        showToast(info+' activa','info');
      });
    });
  },

  bindViewTabs(){
    document.querySelectorAll('[data-attview]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('[data-attview]').forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');
        ['history','students','policy'].forEach(p=>{
          const panel=el('att-panel-'+p);
          if(panel) panel.style.display=btn.dataset.attview===p?'':'none';
        });
      });
    });
  },

  bindOpenForm(){
    document.querySelectorAll('[data-att-open-session]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const d=new Date();
        const dateEl=el('att-date');
        if(dateEl) dateEl.value=d.toISOString().split('T')[0];
        const timeEl=el('att-time');
        if(timeEl) timeEl.value=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        // Pre-mark current section
        const secA=document.querySelector('[name="att-section"][value="A"]');
        const secB=document.querySelector('[name="att-section"][value="B"]');
        if(secA) secA.checked=this.currentSection==='A';
        if(secB) secB.checked=this.currentSection==='B';
        openModal('modal-att-open');
      });
    });
    const form=el('form-att-open');
    if(!form) return;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const btn=form.querySelector('button[type="submit"]');
      if(btn){btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Abriendo…';}
      const sections=Array.from(form.querySelectorAll('[name="att-section"]:checked')).map(x=>x.value);
      const data={
        course_id:'civ247',
        course_name:sections.length===1&&sections[0]==='A'?'Maquinaria — Teoría':sections.length===1&&sections[0]==='B'?'Maquinaria — JTP':'Maquinaria y Equipos de Construcción',
        teacher_id:'tch_1',
        label:el('att-label').value.trim()||'Sesión sin título',
        date:el('att-date').value,
        start_time:el('att-time').value,
        duration_minutes:parseInt(el('att-duration').value)||15,
        note:el('att-note').value.trim(),
        allow_justifications:el('att-allow-just').checked,
        auto_close:el('att-auto-close').checked,
        expected_present:parseInt(el('att-expected').value)||null,
        sections:sections.length?sections:[this.currentSection]
      };
      setTimeout(()=>{
        Engine.createSession(data);
        closeModal('modal-att-open');
        form.reset();
        if(btn){btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-play"></i> Abrir asistencia';}
        // Switch back to sessions tab
        document.querySelector('[data-attview="history"]')?.click();
        this.render();
        showToast('¡Sesión abierta! Los estudiantes ya pueden registrar su asistencia','success');
      },700);
    });
  },

  render(){
    this.renderStats();
    this.renderActiveSessions();
    this.renderHistory();
    this.renderRiskList();
    this.fillPolicyForm();
    this.updatePendingBadge();
  },

  renderStats(){
    const sec=this.currentSection;
    const sessions=Engine.sessionsForSection(sec);
    const stus=Engine.studentsForSection(sec);
    const pol=Engine.policy(sec);
    const resps=Engine.responses();

    setText('att-stat-total',sessions.length);
    setText('att-stat-validated',sessions.filter(s=>s.status===SS.VALIDATED).length);
    setText('att-stat-pending',sessions.filter(s=>s.status===SS.CLOSED).length);

    const pending=sessions.filter(s=>s.status===SS.CLOSED).length;
    const pendingHint=el('att-stat-pending-hint');
    if(pendingHint) pendingHint.textContent=pending?`${pending} por validar`:'Al día';

    const justP=resps.filter(r=>{
      const stu=Engine.students().find(x=>x.id===r.student_id);
      return r.review_status===RS.JUST_PENDING&&stu?.sections.includes(sec);
    }).length;
    setText('att-stat-just-pending',justP);
    const justTrend=el('att-stat-just-trend');
    if(justTrend) justTrend.style.display=justP?'':'none';

    const atRisk=stus.filter(s=>{
      const sum=Engine.studentSummary(s.id,sec);
      return sum.absences>=pol.risk_threshold;
    }).length;
    setText('att-stat-risk',atRisk);
    setText('att-stat-risk-hint',`de ${stus.length} estudiantes en Sec. ${sec}`);
    const openNow=sessions.filter(s=>s.status===SS.OPEN).length;
    const openLbl=el('att-stat-open-lbl');
    if(openLbl){
      openLbl.textContent=openNow?`${openNow} abierta ahora`:'Sin sesión activa';
      openLbl.className='db-stat__trend '+(openNow?'db-stat__trend--up':'');
    }
    setText('att-stat-open',openNow);
  },

  renderActiveSessions(){
    const wrap=el('att-active-sessions');
    if(!wrap) return;
    const open=Engine.sessionsForSection(this.currentSection).filter(s=>s.status===SS.OPEN);
    if(!open.length){
      wrap.innerHTML='';
      return;
    }
    wrap.innerHTML=open.map(s=>{
      const sum=Engine.sessionSummary(s.id,this.currentSection);
      const rem=Engine.timeRemaining(s);
      const secTags=(s.sections||[]).map(x=>`<span class="att-badge att-badge--pending" style="font-size:.6rem">Sec. ${x}</span>`).join('');
      return`
      <div class="db-card att-live-card" id="sc-${s.id}">
        <div class="att-live-card__head">
          <div class="att-live-card__left">
            <div class="att-live-badge"><i class="fa-solid fa-circle att-pulse"></i> EN CURSO</div>
            <div class="att-live-card__title">${s.label}</div>
            <div class="att-live-card__meta">${s.date} · ${s.start_time} · ${s.duration_minutes} min ${secTags}</div>
            ${s.note?`<div class="att-live-card__note"><i class="fa-solid fa-note-sticky"></i> ${s.note}</div>`:''}
          </div>
          <div class="att-live-card__right">
            <div class="att-live-timer">
              <div class="att-live-timer__val" id="timer-${s.id}">${fmtTimer(rem)}</div>
              <div class="att-live-timer__lbl">para cerrar</div>
            </div>
          </div>
        </div>
        <div class="att-live-stats">
          <div class="att-live-stat att-live-stat--present">
            <i class="fa-solid fa-check-circle"></i>
            <span class="att-live-stat__val">${sum.presentReported}</span>
            <span class="att-live-stat__lbl">Asistieron</span>
          </div>
          <div class="att-live-stat att-live-stat--absent">
            <i class="fa-solid fa-times-circle"></i>
            <span class="att-live-stat__val">${sum.absentReported}</span>
            <span class="att-live-stat__lbl">Ausentes</span>
          </div>
          <div class="att-live-stat att-live-stat--just">
            <i class="fa-solid fa-file-lines"></i>
            <span class="att-live-stat__val">${sum.justPending}</span>
            <span class="att-live-stat__lbl">Just. pendientes</span>
          </div>
          <div class="att-live-stat att-live-stat--missing">
            <i class="fa-solid fa-hourglass-half"></i>
            <span class="att-live-stat__val">${sum.notResponded}</span>
            <span class="att-live-stat__lbl">Sin responder</span>
          </div>
        </div>
        <div style="margin-top:.9rem">
          <div class="db-prog" style="margin-bottom:.4rem">
            <div class="db-prog__fill db-prog__fill--green" style="width:${sum.totalEnrolled?Math.round((sum.totalResponded/sum.totalEnrolled)*100):0}%" ></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.73rem;color:var(--t3)">
            <span>${sum.totalResponded} de ${sum.totalEnrolled} respondieron</span>
            <button class="db-btn db-btn--sm db-btn--danger" onclick="AttT.confirmClose('${s.id}')">
              <i class="fa-solid fa-stop"></i> Cerrar sesión
            </button>
          </div>
        </div>
      </div>`;
    }).join('');
    open.forEach(s=>this.startTimer(s));
  },

  startTimer(ses){
    const tick=setInterval(()=>{
      const timerEl=el(`timer-${ses.id}`);
      if(!timerEl){clearInterval(tick);return;}
      const rem=Engine.timeRemaining(ses);
      if(rem<=0){clearInterval(tick);Engine.checkAutoClose();this.render();showToast('La sesión se cerró automáticamente','info');return;}
      timerEl.textContent=fmtTimer(rem);
    },1000);
  },

  confirmClose(id){
    if(!confirm('¿Cerrar la sesión ahora? Los estudiantes ya no podrán responder.')) return;
    Engine.closeSession(id); this.render();
    showToast('Sesión cerrada. Ya puedes revisarla y validarla.','success');
  },

  renderHistory(){
    const wrap=el('att-history-list');
    if(!wrap) return;
    const sec=this.currentSection;
    const closed=Engine.sessionsForSection(sec).filter(s=>s.status!==SS.OPEN);
    if(!closed.length){
      wrap.innerHTML=`
        <div class="db-card" style="text-align:center;padding:2.5rem 1rem">
          <div style="font-size:2rem;opacity:.25;margin-bottom:.8rem"><i class="fa-solid fa-clock-rotate-left"></i></div>
          <div style="color:var(--t3);font-size:.86rem">No hay sesiones registradas para Sección ${sec}</div>
          <button class="db-btn db-btn--primary" style="margin-top:1rem" data-att-open-session>
            <i class="fa-solid fa-play"></i> Abrir primera sesión
          </button>
        </div>`;
      wrap.querySelector('[data-att-open-session]')?.addEventListener('click',()=>openModal('modal-att-open'));
      return;
    }
    wrap.innerHTML=closed.map(s=>{
      const sum=Engine.sessionSummary(s.id,sec);
      const secTags=(s.sections||[]).map(x=>`<span class="att-badge att-badge--pending" style="font-size:.58rem">Sec. ${x}</span>`).join('');
      const pct=sum.totalEnrolled?Math.round((sum.presentReported/sum.totalEnrolled)*100):0;
      return`
      <div class="db-card att-hist-card">
        <div class="att-hist-card__head">
          <div class="att-hist-card__left">
            <div class="att-hist-card__title">${s.label} ${secTags}</div>
            <div class="att-hist-card__meta">${s.date} · ${s.start_time} · ${s.duration_minutes} min</div>
            ${s.note?`<div class="att-hist-card__note"><i class="fa-solid fa-note-sticky"></i> ${s.note}</div>`:''}
          </div>
          <div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">
            ${sesStatusBadge(s.status)}
            ${s.status===SS.CLOSED?`<button class="db-btn db-btn--sm db-btn--primary" onclick="AttT.openReview('${s.id}')"><i class="fa-solid fa-magnifying-glass"></i> Revisar</button>`:''}
            ${s.status===SS.VALIDATED?`<button class="db-btn db-btn--sm db-btn--outline" onclick="AttT.openReview('${s.id}')"><i class="fa-solid fa-eye"></i> Ver</button>`:''}
          </div>
        </div>
        <div class="att-hist-card__stats">
          <div class="att-hist-card__stat"><span style="color:var(--success)"><i class="fa-solid fa-check"></i> ${sum.presentReported}</span> <span class="att-hist-card__stat-lbl">presentes</span></div>
          <div class="att-hist-card__stat"><span style="color:var(--danger)"><i class="fa-solid fa-xmark"></i> ${sum.absentReported}</span> <span class="att-hist-card__stat-lbl">ausentes</span></div>
          <div class="att-hist-card__stat"><span style="color:var(--t3)"><i class="fa-solid fa-minus"></i> ${sum.notResponded}</span> <span class="att-hist-card__stat-lbl">no respondieron</span></div>
          ${sum.suspicious?`<div class="att-hist-card__stat"><span style="color:var(--att-suspicious)"><i class="fa-solid fa-triangle-exclamation"></i> ${sum.suspicious}</span> <span class="att-hist-card__stat-lbl">sospechosos</span></div>`:''}
        </div>
        <div class="db-prog" style="margin-top:.7rem">
          <div class="db-prog__fill ${pct>=80?'db-prog__fill--green':pct>=60?'':'db-prog__fill--orange'}" style="width:${pct}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--t3);margin-top:.3rem">
          <span>${sum.totalResponded}/${sum.totalEnrolled} respondieron</span>
          <span>${pct}% asistencia</span>
        </div>
      </div>`;
    }).join('');
  },

  renderRiskList(){
    const wrap=el('att-risk-list');
    if(!wrap) return;
    const sec=this.currentSection;
    const stus=Engine.studentsForSection(sec);
    const pol=Engine.policy(sec);

    if(!stus.length){
      wrap.innerHTML='<div class="db-card" style="text-align:center;padding:2rem;color:var(--t3)"><i class="fa-solid fa-users" style="font-size:1.5rem;opacity:.3;display:block;margin-bottom:.6rem"></i> No hay estudiantes en Sección '+sec+'</div>';
      return;
    }

    const rows=stus.map(s=>({s,sum:Engine.studentSummary(s.id,sec)}))
      .sort((a,b)=>b.sum.absences-a.sum.absences);

    wrap.innerHTML=`<div class="db-card">
      <div class="db-card__head">
        <div class="db-card__title"><i class="fa-solid fa-users"></i> Estudiantes — Sección ${sec}</div>
        <span style="font-size:.73rem;color:var(--t3)">${stus.length} inscritos · límite ${pol.fail_threshold} faltas</span>
      </div>
      ${rows.map(({s,sum})=>{
        const lvl=sum.absences>=pol.fail_threshold?'fail':sum.absences>=pol.risk_threshold?'risk':sum.absences>=pol.warning_threshold?'warning':'ok';
        const icons={fail:'fa-skull',risk:'fa-triangle-exclamation',warning:'fa-bell',ok:'fa-check-circle'};
        return`
        <div class="att-risk-row att-risk-row--${lvl}">
          <div class="att-risk-row__avatar">${s.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
          <div class="att-risk-row__info">
            <div class="att-risk-row__name">${s.name}</div>
            <div class="att-risk-row__meta">${s.code} · ${sum.absences} falta${sum.absences!==1?'s':''} · ${sum.attendanceRate}% asistencia</div>
          </div>
          <div class="att-risk-bar"><div class="att-risk-bar__fill att-risk-bar__fill--${lvl}" style="width:${Math.min(100,(sum.absences/pol.fail_threshold)*100)}%"></div></div>
          <span class="att-badge att-badge--${lvl}"><i class="fa-solid ${icons[lvl]}"></i> ${sum.absences}/${pol.fail_threshold}</span>
        </div>`;
      }).join('')}
    </div>`;
  },

  fillPolicyForm(){
    const pol=Engine.policy(this.currentSection);
    ['max_absences','max_justifications','warning_threshold','risk_threshold','fail_threshold']
      .forEach(f=>{const e=el('pol-'+f);if(e) e.value=pol[f];});
    const lbl=el('att-policy-sec-lbl');
    if(lbl) lbl.textContent='Sección '+this.currentSection+(this.currentSection==='A'?' — Teoría':' — JTP');
  },

  bindPolicyForm(){
    const form=el('form-att-policy');
    if(!form) return;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const pol=Engine.policy(this.currentSection);
      ['max_absences','max_justifications','warning_threshold','risk_threshold','fail_threshold']
        .forEach(f=>{const v=parseInt(el('pol-'+f)?.value);if(!isNaN(v)) pol[f]=v;});
      Engine.savePolicy(pol);
      this.render();
      showToast('Reglas de Sección '+this.currentSection+' actualizadas','success');
    });
  },

  updatePendingBadge(){
    const badge=el('att-pending-badge');
    if(!badge) return;
    const pending=Engine.sessions().filter(s=>s.status===SS.CLOSED).length+
      Engine.responses().filter(r=>r.review_status===RS.JUST_PENDING).length;
    badge.textContent=pending||'';
    badge.style.display=pending?'':'none';
  },

  openReview(sessionId){
    const sum=Engine.sessionSummary(sessionId,this.currentSection);
    if(!sum) return;
    const s=sum.session;
    const modal=el('modal-att-review');
    if(!modal) return;

    setText('rev-label',s.label);
    setText('rev-course',(s.sections||[]).map(x=>'Sección '+x).join(' · '));
    setText('rev-date',`${s.date} · ${s.start_time}`);
    setText('rev-duration',`${s.duration_minutes} min`);
    setText('rev-enrolled',sum.totalEnrolled);
    setText('rev-responded',sum.totalResponded);
    setText('rev-present',sum.presentReported);
    setText('rev-absent',sum.absentReported);
    setText('rev-just-p',sum.justPending);
    setText('rev-missing',sum.notResponded);
    setText('rev-suspicious',sum.suspicious);

    const bar=el('rev-progress-fill');
    if(bar) bar.style.width=`${sum.totalEnrolled?Math.round((sum.totalResponded/sum.totalEnrolled)*100):0}%`;
    setText('rev-progress-txt',`${sum.totalResponded} de ${sum.totalEnrolled} respondieron`);

    if(s.expected_present){
      const ew=el('rev-expected-wrap');
      if(ew){ ew.style.display='';
        setText('rev-expected',s.expected_present);
        const diff=sum.presentReported-s.expected_present;
        const diffEl=el('rev-diff');
        if(diffEl){diffEl.textContent=diff>=0?`+${diff}`:String(diff);diffEl.style.color=diff<0?'var(--att-absent)':diff>0?'var(--att-suspicious)':'var(--att-present)';}
      }
    } else { const ew=el('rev-expected-wrap'); if(ew) ew.style.display='none'; }

    const tbody=el('rev-table-body');
    if(tbody){
      tbody.innerHTML=sum.enrolledStudents.map(stu=>{
        const r=sum.responses.find(x=>x.student_id===stu.id);
        if(!r) return`
          <tr class="att-rev-row att-rev-row--missing">
            <td><div class="att-rev-name">${stu.name}</div><div class="att-rev-code">${stu.code}</div></td>
            <td><span class="att-badge att-badge--missing"><i class="fa-solid fa-minus"></i> Sin respuesta</span></td>
            <td>—</td><td>—</td>
            <td><span class="att-badge att-badge--missing">Sin respuesta</span></td>
            <td><input type="text" class="att-obs-input" placeholder="Obs…" data-resp-session="${s.id}"></td>
            <td>—</td>
          </tr>`;
        return`
          <tr class="att-rev-row ${r.review_status===RS.SUSPICIOUS?'att-rev-row--suspicious':r.review_status===RS.INVALIDATED?'att-rev-row--invalid':''}" data-resp-id="${r.id}">
            <td><div class="att-rev-name">${stu.name}</div><div class="att-rev-code">${stu.code}</div></td>
            <td><span class="att-badge att-badge--${r.reported_status==='present'?'present':'absent'}">
              <i class="fa-solid fa-${r.reported_status==='present'?'check':'xmark'}"></i>
              ${r.reported_status==='present'?'Asistí':'No asistí'}</span></td>
            <td class="att-time">${fmtTime(r.submitted_at)}</td>
            <td>${r.note?`<span class="att-note-preview" title="${r.note}"><i class="fa-solid fa-comment"></i> ${r.note.length>40?r.note.slice(0,40)+'…':r.note}</span>`:'<span class="att-none">—</span>'}</td>
            <td>${respStatusBadge(r.review_status)}</td>
            <td><input type="text" class="att-obs-input" value="${r.teacher_observation||''}" placeholder="Obs…" data-resp-id="${r.id}"></td>
            <td class="att-actions-cell">${this.rowActions(r)}</td>
          </tr>`;
      }).join('');
      tbody.querySelectorAll('[data-rev-action]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const{revAction,respId}=btn.dataset;
          const obs=btn.closest('tr')?.querySelector(`.att-obs-input[data-resp-id="${respId}"]`)?.value||'';
          Engine.reviewResponse(respId,revAction,obs);
          this.openReview(sessionId); this.render();
          const msgs={validate:'Validado',invalidate:'Invalidado',suspicious:'Marcado sospechoso',accept_justification:'Justificación aceptada',reject_justification:'Justificación rechazada'};
          showToast(msgs[revAction]||'Acción registrada','success');
        });
      });
    }

    modal.querySelector('[data-att-validate-all]').onclick=()=>{
      if(!confirm('¿Validar la sesión completa?')) return;
      Engine.validateSession(sessionId); closeModal('modal-att-review'); this.render();
      showToast('Sesión validada correctamente','success');
    };
    modal.querySelector('[data-att-invalidate-all]').onclick=()=>{
      const reason=prompt('Motivo de invalidación (obligatorio):');
      if(!reason?.trim()) return;
      Engine.invalidateSession(sessionId,reason.trim()); closeModal('modal-att-review'); this.render();
      showToast('Sesión invalidada. Motivo registrado.','info');
    };
    modal.classList.add('is-open');
  },

  rowActions(r){
    const b=(action,color,icon,label)=>
      `<button class="db-btn db-btn--xs db-btn--${color}" data-rev-action="${action}" data-resp-id="${r.id}"><i class="fa-solid fa-${icon}"></i>${label?` ${label}`:''}</button>`;
    if(r.review_status===RS.PRESENT) return b('validate','success','check','Validar')+b('suspicious','warn','triangle-exclamation','')+b('invalidate','danger','xmark','');
    if(r.review_status===RS.JUST_PENDING) return b('accept_justification','success','check','Aceptar')+b('reject_justification','danger','xmark','Rechazar');
    if([RS.VALIDATED,RS.SUSPICIOUS].includes(r.review_status)) return b('invalidate','outline','ban','Invalidar');
    if(r.review_status===RS.JUST_OK||r.review_status===RS.JUST_NO) return b('validate','success','rotate-left','Reconsiderar');
    return'<span class="att-none">—</span>';
  }
};
window.AttT=AttT;

/* ═══════════════════════════════════════════════════════════════
   MÓDULO ESTUDIANTE
══════════════════════════════════════════════════════════════ */
const AttS={
  studentId:'stu_1',
  _modalTimer:null,

  init(){
    if(!el('att-student-module')) return;
    this.bindResponseForm();
    this.renderStudentView();
    this.pollSession();
    setInterval(()=>this.pollSession(),5000);
  },

  pollSession(){
    Engine.checkAutoClose();
    const ses=Engine.openSessionForStudent(this.studentId);
    const banner=el('att-open-banner');
    if(!banner) return;
    if(ses){
      banner.style.display='';
      banner.innerHTML=`
        <div class="att-open-alert">
          <div class="att-open-alert__icon"><i class="fa-solid fa-bell att-pulse"></i></div>
          <div class="att-open-alert__body">
            <div class="att-open-alert__title">¡Asistencia abierta! — ${ses.label}</div>
            <div class="att-open-alert__meta">${ses.course_name||'CIV 247'} · ${(ses.sections||[]).map(x=>'Sección '+x).join(' / ')} · ${ses.date}
              · Cierra en <strong id="att-banner-timer">${fmtTimer(Engine.timeRemaining(ses))}</strong></div>
          </div>
          <button class="db-btn db-btn--primary db-btn--sm" onclick="AttS.openResponseForm('${ses.id}')">
            <i class="fa-solid fa-clipboard-check"></i> Registrar asistencia
          </button>
        </div>`;
      this.startBannerTimer(ses);
    } else {
      banner.style.display='none';
    }
  },

  startBannerTimer(ses){
    const tick=setInterval(()=>{
      const t=el('att-banner-timer');
      if(!t){clearInterval(tick);return;}
      const rem=Engine.timeRemaining(ses);
      if(rem<=0){clearInterval(tick);this.pollSession();return;}
      t.textContent=fmtTimer(rem);
    },1000);
  },

  openResponseForm(sessionId){
    const ses=Engine.sessions().find(s=>s.id===sessionId);
    if(!ses) return;
    const stu=Engine.students().find(s=>s.id===this.studentId)||{};
    const modal=el('modal-att-respond');
    if(!modal) return;

    setText('att-resp-student',stu.name||'Estudiante');
    setText('att-resp-course',ses.course_name||'CIV 247');
    setText('att-resp-date',`${ses.date} · ${ses.start_time}`);
    setText('att-resp-label',ses.label);

    const form=el('form-att-respond');
    if(form){
      form.dataset.sessionId=sessionId;
      form.querySelectorAll('input[name="att-status"]').forEach(r=>{r.checked=false;r.disabled=false;});
      const noteEl=el('att-resp-note');
      if(noteEl){noteEl.value='';noteEl.disabled=false;}
      if(el('att-resp-note-group')) el('att-resp-note-group').style.display='none';
      if(el('att-resp-confirmation')) el('att-resp-confirmation').style.display='none';
      if(el('att-resp-form-body')) el('att-resp-form-body').style.display='';
      const sb=form.querySelector('button[type="submit"]');
      if(sb){sb.disabled=false;sb.innerHTML='<i class="fa-solid fa-paper-plane"></i> Enviar respuesta';}
    }

    if(this._modalTimer) clearInterval(this._modalTimer);
    this._modalTimer=setInterval(()=>{
      const t=el('att-resp-timer');
      if(!t){clearInterval(this._modalTimer);return;}
      const rem=Engine.timeRemaining(ses);
      if(rem<=0){
        clearInterval(this._modalTimer);
        t.innerHTML='<i class="fa-solid fa-lock"></i> Plazo finalizado';
        t.classList.add('att-timer--expired');
        el('att-resp-form-body')?.querySelectorAll('input,button,textarea').forEach(e=>e.disabled=true);
        return;
      }
      t.innerHTML=`<i class="fa-solid fa-clock"></i> Cierra en <strong>${fmtTimer(rem)}</strong>`;
    },1000);

    modal.classList.add('is-open');
  },

  bindResponseForm(){
    document.querySelectorAll('input[name="att-status"]').forEach(radio=>{
      radio.addEventListener('change',()=>{
        const ng=el('att-resp-note-group');
        if(!ng) return;
        const isAbsent=radio.value==='absent';
        ng.style.display=isAbsent?'':'none';
        const noteEl=el('att-resp-note');
        if(noteEl) noteEl.required=isAbsent;
      });
    });
    const form=el('form-att-respond');
    if(!form) return;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const sessionId=form.dataset.sessionId;
      const radio=form.querySelector('input[name="att-status"]:checked');
      if(!radio){showToast('Debes indicar si asististe o no','error');return;}
      const reported=radio.value;
      const note=el('att-resp-note')?.value?.trim()||'';
      if(reported==='absent'&&!note){showToast('La justificación es obligatoria si no asististe','error');el('att-resp-note')?.focus();return;}
      const btn=form.querySelector('button[type="submit"]');
      if(btn){btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando…';}
      setTimeout(()=>{
        const result=Engine.submitResponse(sessionId,this.studentId,reported,note);
        if(!result.ok){showToast(result.error,'error');if(btn){btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-paper-plane"></i> Enviar respuesta';}return;}
        el('att-resp-form-body').style.display='none';
        const conf=el('att-resp-confirmation');
        if(conf){
          conf.style.display='';
          conf.innerHTML=`
            <div class="att-confirmation">
              <div class="att-confirmation__icon att-confirmation__icon--${reported==='present'?'success':'info'}">
                <i class="fa-solid fa-${reported==='present'?'circle-check':'circle-info'}"></i>
              </div>
              <h3>${reported==='present'?'¡Asistencia registrada!':'Ausencia registrada'}</h3>
              <p>${reported==='present'?'Tu presencia fue enviada correctamente.':'Tu ausencia fue registrada con la justificación indicada.'}</p>
              <div class="att-confirmation__details">
                <div><span>Estado:</span> <strong>${reported==='present'?'Asistí':'No asistí'}</strong></div>
                <div><span>Enviado el:</span> <strong>${fmtDateTime(Date.now())}</strong></div>
                ${note?`<div><span>Justificación:</span> <em>"${note}"</em></div>`:''}
                <div class="att-confirmation__notice">
                  <i class="fa-solid fa-circle-info"></i>
                  Tu respuesta queda pendiente de revisión y validación del docente.
                </div>
              </div>
              <button class="db-btn db-btn--primary" onclick="closeModal('modal-att-respond')">
                <i class="fa-solid fa-check"></i> Entendido
              </button>
            </div>`;
        }
        this.renderStudentView(); this.pollSession();
      },800);
    });
  },

  renderStudentView(){
    const stu=Engine.students().find(s=>s.id===this.studentId);
    const sections=stu?.sections||['A'];
    // Render stats for each section the student belongs to
    // Primary section for the ring/overview
    const priSec=sections[0];
    const sum=Engine.studentSummary(this.studentId,priSec);

    const ring=el('stu-att-ring');
    if(ring){
      const r=parseFloat(ring.getAttribute('r'))||48;
      const circ=2*Math.PI*r;
      ring.style.strokeDasharray=circ;
      setTimeout(()=>{ring.style.strokeDashoffset=circ-(circ*sum.attendanceRate/100);},100);
    }
    setText('stu-att-rate-val',sum.attendanceRate+'%');
    setText('stu-att-absences',sum.absences);
    setText('stu-att-total-sessions',sum.totalSessions);
    setText('stu-att-just-sent',sum.justSent);
    setText('stu-att-just-ok',sum.justOk);
    setText('stu-att-just-no',sum.justNo);
    setText('stu-att-rem-just',sum.remainingJust);

    // Per-section mini summaries
    const secWrap=el('stu-att-sec-summaries');
    if(secWrap){
      secWrap.innerHTML=sections.map(sec=>{
        const s=Engine.studentSummary(this.studentId,sec);
        const pol=s.policy;
        const lvl=s.absences>=pol.fail_threshold?'fail':s.absences>=pol.risk_threshold?'risk':s.absences>=pol.warning_threshold?'warning':'ok';
        return`
          <div class="att-sec-summary-card att-sec-summary-card--${sec.toLowerCase()}">
            <div class="att-sec-summary-card__head">
              <span class="att-sec-btn__tag att-sec-btn__tag--${sec.toLowerCase()}">${sec}</span>
              <strong>${sec==='A'?'Teoría':'JTP / Práctica'}</strong>
            </div>
            <div class="att-sec-summary-card__body">
              <div><span class="att-badge att-badge--${lvl}">${s.absences} falta${s.absences!==1?'s':''}</span></div>
              <div style="font-size:.75rem;color:var(--t3)">${s.attendanceRate}% asistencia · ${s.totalSessions} clases</div>
              <div style="font-size:.75rem;color:var(--t3)">Límite: ${pol.fail_threshold} faltas</div>
            </div>
          </div>`;
      }).join('');
    }

    const alertsWrap=el('stu-att-alerts');
    if(alertsWrap){
      // Collect alerts from all sections
      const allAlerts=sections.flatMap(sec=>Engine.studentSummary(this.studentId,sec).alerts.map(a=>({...a,sec})));
      const icons={fail:'fa-skull',risk:'fa-triangle-exclamation',warning:'fa-bell'};
      alertsWrap.innerHTML=allAlerts.map(a=>
        `<div class="att-alert att-alert--${a.type}"><i class="fa-solid ${icons[a.type]||'fa-circle-info'}"></i>
          <span><strong>Sección ${a.sec}:</strong> ${a.msg}</span></div>`
      ).join('');
    }

    setText('stu-pol-max-abs',sum.policy.max_absences);
    setText('stu-pol-max-just',sum.policy.max_justifications);
    setText('stu-pol-warn-at',sum.policy.warning_threshold);
    setText('stu-pol-fail-at',sum.policy.fail_threshold);

    const histWrap=el('stu-att-history');
    if(!histWrap) return;
    // Combine history from all sections
    const allHistory=sections.flatMap(sec=>{
      const s=Engine.studentSummary(this.studentId,sec);
      return s.history.map(h=>({...h,sec}));
    }).sort((a,b)=>new Date(b.session.date)-new Date(a.session.date));

    if(!allHistory.length){
      histWrap.innerHTML='<div class="db-card" style="text-align:center;padding:2rem;color:var(--t3)"><i class="fa-solid fa-clock-rotate-left" style="font-size:1.5rem;opacity:.3;display:block;margin-bottom:.6rem"></i> Sin historial de sesiones aún.</div>';
      return;
    }

    histWrap.innerHTML=allHistory.map(({session:ses,response:r,sec})=>{
      let sk,sl,si;
      if(!r){ sk='missing';sl='Sin respuesta';si='minus'; }
      else if(r.review_status===RS.VALIDATED){sk='validated';sl='Presente validado';si='check-double';}
      else if(r.review_status===RS.JUST_OK){sk='just-ok';sl='Justificación aceptada';si='check';}
      else if(r.review_status===RS.JUST_NO){sk='just-no';sl='Justificación rechazada';si='xmark';}
      else if(r.review_status===RS.JUST_PENDING){sk='just-pending';sl='Justificación pendiente';si='hourglass';}
      else if(r.reported_status==='present'){sk='pending';sl='Pendiente revisión';si='hourglass-half';}
      else{sk='absent';sl='Ausente';si='xmark';}
      return`
        <div class="att-hist-row att-hist-row--${sk}">
          <div class="att-hist-row__date">${ses.date}</div>
          <div class="att-hist-row__label">${ses.label}</div>
          <span class="att-sec-btn__tag att-sec-btn__tag--${sec.toLowerCase()}" style="font-size:.6rem">${sec}</span>
          <span class="att-badge att-badge--${sk}"><i class="fa-solid fa-${si}"></i> ${sl}</span>
          ${r?.teacher_observation?`<div class="att-hist-row__obs"><i class="fa-solid fa-comment-dots"></i> ${r.teacher_observation}</div>`:''}
        </div>`;
    }).join('');
  }
};
window.AttS=AttS;

/* ─── Bootstrap ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  seedData();
  Engine.checkAutoClose();
  AttT.init();
  AttS.init();
});

})();
