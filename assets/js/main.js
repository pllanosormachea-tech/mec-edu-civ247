/* ============================================================
   Maquinaria y Equipo de Construcción · JS compartido
   Animaciones, navegación, componentes interactivos
   ============================================================ */
(function(){
  'use strict';

  /* -------- Scroll reveal -------- */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
  },{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  /* -------- Sidebar toggle (mobile) -------- */
  const sbToggle = document.querySelector('[data-sidebar-toggle]');
  const sb = document.querySelector('.sidebar');
  if(sbToggle && sb){
    const bd = document.createElement('div');
    bd.className = 'sidebar-backdrop';
    document.body.appendChild(bd);
    sbToggle.addEventListener('click',()=>{
      sb.classList.toggle('is-open');
      bd.classList.toggle('is-open');
    });
    bd.addEventListener('click',()=>{
      sb.classList.remove('is-open');
      bd.classList.remove('is-open');
    });
  }

  /* -------- Auth tabs (docente / estudiante) -------- */
  const tabsWrap = document.querySelector('[data-auth-tabs]');
  if(tabsWrap){
    const tabs = tabsWrap.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('[data-auth-form]');
    tabs.forEach(t=>{
      t.addEventListener('click',()=>{
        const role = t.dataset.role;
        tabs.forEach(x=>x.classList.toggle('is-active',x===t));
        forms.forEach(f=>f.style.display = (f.dataset.authForm===role)?'block':'none');
      });
    });
  }

  /* -------- Course module accordion -------- */
  document.querySelectorAll('.module-head').forEach(h=>{
    h.addEventListener('click',()=>{
      h.parentElement.classList.toggle('is-open');
    });
  });

  /* -------- In-page tabs (no hay cambio de url) -------- */
  document.querySelectorAll('[data-tabs]').forEach(wrap=>{
    const btns = wrap.querySelectorAll('.tab');
    const panels = document.querySelectorAll('[data-tab-panel]');
    btns.forEach(b=>{
      b.addEventListener('click',()=>{
        const id = b.dataset.tab;
        btns.forEach(x=>x.classList.toggle('is-active',x===b));
        panels.forEach(p=>p.style.display = (p.dataset.tabPanel===id)?'':'none');
      });
    });
  });

  /* -------- Dummy form (login/registro) – simula envío -------- */
  document.querySelectorAll('[data-fake-submit]').forEach(f=>{
    f.addEventListener('submit',e=>{
      e.preventDefault();
      const btn = f.querySelector('button[type="submit"]');
      if(!btn) return;
      const prev = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Procesando…';
      setTimeout(()=>{
        const redirect = f.dataset.redirect;
        if(redirect) window.location.href = redirect;
        else { btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Hecho!'; setTimeout(()=>{btn.disabled=false;btn.innerHTML=prev;},1200); }
      },900);
    });
  });

  /* -------- Validación ligera correo institucional -------- */
  const emailInput = document.querySelector('[data-institutional-email]');
  if(emailInput){
    const help = emailInput.parentElement.parentElement.querySelector('.form-help');
    const check = ()=>{
      const v = emailInput.value.trim().toLowerCase();
      if(!v){ help.innerHTML='<i class="fa-solid fa-circle-info"></i> Solo se permiten correos institucionales (@umss.edu, @uni.edu, etc).'; help.style.color=''; return; }
      const inst = /@([a-z0-9-]+\.)?(edu|edu\.[a-z]{2,}|ac\.[a-z]{2,})$/i.test(v);
      if(inst){ help.innerHTML='<i class="fa-solid fa-circle-check"></i> Correo institucional válido'; help.style.color='var(--success)'; }
      else { help.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> Debe ser un correo institucional (dominio .edu)'; help.style.color='var(--warning)'; }
    };
    emailInput.addEventListener('input',check);
    emailInput.addEventListener('blur',check);
  }

  /* -------- Contador animado (números hero/stats) -------- */
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1]||'').length;
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();
    const ease = t=>1-Math.pow(1-t,3);
    function tick(now){
      const p = Math.min(1,(now-start)/dur);
      const v = target*ease(p);
      el.textContent = v.toFixed(decimals)+suffix;
      if(p<1) requestAnimationFrame(tick);
    }
    const once = new IntersectionObserver(ents=>{
      ents.forEach(ent=>{ if(ent.isIntersecting){ requestAnimationFrame(tick); once.unobserve(el); } });
    },{threshold:0.3});
    once.observe(el);
  });

  /* -------- Avatar upload (registro estudiante) -------- */
  function initAvatarUpload(){
    document.querySelectorAll('[data-avatar-upload]').forEach(wrap=>{
      const preview=wrap.querySelector('.auth-avatar-preview');
      const input=wrap.querySelector('input[type="file"]');
      const info=wrap.querySelector('.auth-avatar-info span');
      if(!preview||!input) return;
      preview.addEventListener('click',()=>input.click());
      input.addEventListener('change',()=>{
        const file=input.files[0];
        if(!file) return;
        if(file.size>5*1024*1024){alert('La imagen supera el límite de 5 MB');return;}
        const reader=new FileReader();
        reader.onload=ev=>{
          preview.innerHTML=`<img src="${ev.target.result}" alt="Foto de perfil" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
          if(info) info.textContent=file.name;
        };
        reader.readAsDataURL(file);
      });
    });
  }
  initAvatarUpload();

  /* -------- Semester toggle (registro estudiante) -------- */
  function initSemToggle(){
    document.querySelectorAll('[data-sem-toggle]').forEach(wrap=>{
      const btns=wrap.querySelectorAll('.sem-btn');
      const hidden=wrap.parentElement.querySelector('[data-sem-value]');
      btns.forEach(btn=>{
        btn.addEventListener('click',()=>{
          btns.forEach(b=>b.classList.remove('is-active'));
          btn.classList.add('is-active');
          if(hidden) hidden.value=btn.dataset.sem;
        });
      });
    });
  }
  initSemToggle();

  /* -------- Año footer -------- */
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent = new Date().getFullYear());

  /* -------- Parallax suave en hero panel -------- */
  const hero = document.querySelector('[data-hero-parallax]');
  if(hero && window.matchMedia('(pointer:fine)').matches){
    hero.addEventListener('mousemove',e=>{
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX-r.left)/r.width-0.5)*10;
      const y = ((e.clientY-r.top)/r.height-0.5)*10;
      hero.style.transform = `perspective(1200px) rotateY(${x*0.3}deg) rotateX(${-y*0.3}deg) translateZ(0)`;
    });
    hero.addEventListener('mouseleave',()=>{ hero.style.transform=''; });
  }

})();

/* ============================================================
   EFECTOS ESPECIALES · Cursor · Partículas · Glitch
   ============================================================ */

/* ---- Cursor personalizado (todas las páginas, solo desktop) ---- */
(function(){
  if(!window.matchMedia('(hover:fine)').matches) return;
  const el = document.createElement('div');
  el.className = 'lp-cursor';
  el.innerHTML = '<span class="lp-cursor__ring"></span><span class="lp-cursor__dot"></span><span class="lp-cursor__ch lp-cursor__ch--h"></span><span class="lp-cursor__ch lp-cursor__ch--v"></span>';
  document.body.appendChild(el);
  document.body.classList.add('lp-cursor-active');
  const ring=el.querySelector('.lp-cursor__ring'),dot=el.querySelector('.lp-cursor__dot'),chH=el.querySelector('.lp-cursor__ch--h'),chV=el.querySelector('.lp-cursor__ch--v');
  let mx=-200,my=-200,rx=-200,ry=-200;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
  (function tick(){
    rx+=(mx-rx)*.18; ry+=(my-ry)*.18;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
    chH.style.left=mx+'px'; chH.style.top=my+'px';
    chV.style.left=mx+'px'; chV.style.top=my+'px';
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(tick);
  })();
  function addHover(el){ el.addEventListener('mouseenter',()=>el.closest('body').querySelector('.lp-cursor').classList.add('is-hover')); el.addEventListener('mouseleave',()=>el.closest('body').querySelector('.lp-cursor').classList.remove('is-hover')); }
  document.querySelectorAll('a,button,[role="button"]').forEach(link=>{
    link.addEventListener('mouseenter',()=>el.classList.add('is-hover'));
    link.addEventListener('mouseleave',()=>el.classList.remove('is-hover'));
  });
})();

/* ---- Partículas flotantes (solo en index con canvas#lp-particles) ---- */
(function(){
  const canvas=document.getElementById('lp-particles');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight}
  window.addEventListener('resize',resize); resize();
  const cols=['rgba(255,184,0,','rgba(255,107,53,','rgba(180,130,0,','rgba(200,150,60,'];
  const pts=Array.from({length:75},()=>({
    x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,
    r:Math.random()*1.8+.4,op:Math.random()*.4+.08,
    spd:Math.random()*.32+.08,drift:(Math.random()-.5)*.22,
    col:cols[Math.floor(Math.random()*cols.length)],life:Math.random()*Math.PI
  }));
  (function frame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pts.forEach(p=>{
      p.y-=p.spd; p.x+=p.drift; p.life+=.004;
      if(p.y<-8){p.y=canvas.height+8;p.x=Math.random()*canvas.width;p.life=0}
      const a=p.op*Math.abs(Math.sin(p.life));
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.col+a+')'; ctx.fill();
    });
    requestAnimationFrame(frame);
  })();
})();

/* ---- Glitch periódico en el heading del hero ---- */
(function(){
  const h=document.querySelector('[data-animated-heading]');
  if(!h) return;
  setTimeout(()=>{
    setInterval(()=>{
      h.classList.add('is-glitching');
      setTimeout(()=>h.classList.remove('is-glitching'),450);
    },5500);
  },2800);
})();
