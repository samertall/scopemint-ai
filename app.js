(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const samples = {
    web: {title:'Luma Coffee — Website Redesign', budget:'1200', brief:'Redesign our coffee shop website with 5 responsive pages, a menu page, online booking form, and basic SEO. Include a mobile-friendly navigation, two revision rounds and handoff assets. Target delivery is in 3 weeks. Our total budget is $1,200.'},
    brand: {title:'Nook Studio — Brand Identity', budget:'2400', brief:'Create a complete identity for Nook Studio, a sustainable homeware brand. We need a logo, color palette, brand typography, mini style guide, packaging concepts and six social media templates. Please include 2 revision rounds with final handover in four weeks. Budget is $2,400.'},
    education: {title:'Spark Academy — Learning Course', budget:'1800', brief:'We need a short phonics course for young learners including 8 interactive lessons, 3 quiz checkpoints, colorful learning activities and downloadable teacher notes. Aim to deliver within 5 weeks for a total budget of $1,800. Include one revision round after our learning team reviews the first draft.'}
  };
  const KEY_AGREEMENT='scopemint.agreement.v1';
  const KEY_ACTIVITIES='scopemint.activity.v1';
  const KEY_PAID='scopemint.paid.v1';
  const state={agreement:null,activity:[],paid:{},status:{paypalSandbox:false,aiMode:'built-in-ml'},selectedMilestone:null,loading:false};
  const fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  const safeLoad=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const setText=(id,value)=>{const e=$(id);if(e)e.textContent=value};
  const persist=()=>{try{localStorage.setItem(KEY_AGREEMENT,JSON.stringify(state.agreement));localStorage.setItem(KEY_ACTIVITIES,JSON.stringify(state.activity));localStorage.setItem(KEY_PAID,JSON.stringify(state.paid))}catch{}};
  let toastTimer=null;
  function toast(message){const node=$('toast');node.textContent=message;node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{node.hidden=true},4600)}
  function showView(name){
    ['workspace','activity','how'].forEach(view=>{$('view-'+view).hidden=view!==name});
    document.querySelectorAll('.nav-item').forEach(b=>{const selected=b.dataset.view===name;b.classList.toggle('active',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
    setText('breadcrumb-view',name==='workspace'?'Workbench':name==='activity'?'Payment activity':'How it works');
    if(name==='activity')renderActivity();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function countChars(){setText('char-counter',`${$('project-brief').value.length.toLocaleString()} / 3,000`)}
  function savePaidAndActivity(milestone,mode,response){
    const key=`${state.agreement?.title||'project'}:${milestone.id}`;
    state.paid[key]={mode,date:now(),transactionId:response?.captureId||response?.id||null};
    state.activity.unshift({id:crypto.randomUUID?.()||String(Date.now()),project:state.agreement?.title||'Project',milestone:milestone.name,amount:milestone.amount,mode,date:now(),paypalOrderId:response?.id||null,captureId:response?.captureId||null});
    state.activity=state.activity.slice(0,60);persist();renderAgreement();renderActivity();toast(mode==='sandbox'?'PayPal Sandbox capture complete. No real money moved.':'Demo payment simulated. No PayPal transaction was made.');
  }
  function renderActivity(){
    setText('activity-count',state.activity.length);setText('activity-total',`${state.activity.length} record${state.activity.length===1?'':'s'}`);
    if(!state.activity.length){$('activity-list').innerHTML='<div class="empty-activity">No activity yet. Approve a milestone with a test payment or simulation to see it here.</div>';return;}
    $('activity-list').innerHTML=state.activity.map(e=>`<div class="activity-item"><div class="activity-item-icon">${e.mode==='sandbox'?'✓':'◇'}</div><div class="activity-item-info"><strong>${esc(e.milestone)}</strong><span>${esc(e.project)} · ${new Date(e.date).toLocaleString()} · ${e.mode==='sandbox'?'PayPal Sandbox capture':'Simulated — no PayPal transaction'}</span>${e.captureId?`<span>Capture ID: ${esc(e.captureId)}</span>`:''}</div><div class="activity-item-amount">${fmt(e.amount)}<span>${e.mode==='sandbox'?'SANDBOX':'SIMULATED'}</span></div></div>`).join('');
  }
  function renderInsights(){
    const a=state.agreement; if(!a){$('insights-empty').hidden=false;$('insights-content').hidden=true;return;}
    $('insights-empty').hidden=true;$('insights-content').hidden=false;
    $('score-ring').style.setProperty('--score',a.score);
    setText('clarity-score',a.score);
    setText('clarity-heading',a.score>=85?'Clear and ready to review.':a.score>=65?'Good foundation.':'A few gaps to resolve.');
    setText('clarity-message',a.score>=85?'Key details are present. Review milestones and pricing before payment.':a.score>=65?'Resolve the listed details with your client to reduce ambiguity.':'Add missing deliverables, timelines and review terms before proceeding.');
    setText('category-name',a.category);setText('confidence-score',`${a.confidence}%`);
    setText('risk-count',`${a.risks.length} note${a.risks.length===1?'':'s'}`);
    $('risk-list').innerHTML=a.risks.length?a.risks.map(r=>`<div class="risk-item severity-${esc(r.severity)}"><div class="risk-icon">!</div><div><strong>${esc(r.title)}</strong><p>${esc(r.detail)}</p></div></div>`).join(''):'<div class="risk-item pass"><span class="risk-icon">✓</span><div><strong>Core clarity checks passed</strong><p>Deliverables, timing and revision language were found. Always confirm final terms together.</p></div></div>';
    setText('model-badge',a.aiProvider?.startsWith('openai')?'OPENAI + BUILT-IN ML':'BUILT-IN ML');
    setText('engine-description',a.aiProvider?.startsWith('openai')?'The locally trained ML classifier categorized your project; OpenAI enriched the human-readable agreement without changing prices.':'The on-server Naive Bayes model classified your brief and structured checks identified missing terms. No external AI API key is required.');
  }
  function renderAgreement(){
    const a=state.agreement;if(!a){$('agreement-placeholder').hidden=false;$('agreement-content').hidden=true;return;}
    $('agreement-placeholder').hidden=true;$('agreement-content').hidden=false;
    setText('agreement-title',a.title);setText('agreement-summary',a.summary);setText('agreement-total',fmt(a.budget));
    $('milestone-list').innerHTML=a.milestones.map(m=>{
      const p=state.paid[`${a.title}:${m.id}`];return `<div class="milestone-row"><span class="milestone-index">${String(m.id).padStart(2,'0')}</span><div class="milestone-info"><strong>${esc(m.name)}</strong><p>${esc(m.details)}</p><span class="milestone-progress">${m.percent}% of total ${p?' · '+(p.mode==='sandbox'?'PAID IN SANDBOX':'SIMULATED'):''}</span></div><div class="milestone-payment"><strong>${fmt(m.amount)}</strong>${p?`<button class="paid" disabled>${p.mode==='sandbox'?'✓ Sandbox paid':'◇ Simulated'}</button>`:`<button class="pay-milestone" data-id="${m.id}">Review & pay ↗</button>`}</div></div>`
    }).join('');
    document.querySelectorAll('.pay-milestone').forEach(b=>b.addEventListener('click',()=>openPayModal(Number(b.dataset.id))));
  }
  function resetPaymentIfChanged(next){
    const prev=state.agreement;
    if(!prev||prev.title!==next.title||prev.budget!==next.budget||prev.milestones.length!==next.milestones.length){state.paid={};}
  }
  async function analyze(){
    if(state.loading)return;
    const brief=$('project-brief').value.trim(),title=$('project-title').value.trim(),budget=Number($('budget').value);
    if(brief.length<20){toast('Please add at least 20 characters to the project brief.');$('project-brief').focus();return;}
    if(!Number.isFinite(budget)||budget<1||budget>100000){toast('Budget must be between $1 and $100,000.');$('budget').focus();return;}
    state.loading=true;setText('analyze-label','Analyzing your brief…');$('analyze-button').disabled=true;
    try{
      const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brief,title,budget})});
      const data=await response.json();if(!response.ok)throw new Error(data.message||'Could not analyze the brief');
      resetPaymentIfChanged(data);state.agreement=data;persist();renderInsights();renderAgreement();toast(`Agreement generated with ${data.aiProvider?.startsWith('openai')?'OpenAI + built-in ML':'built-in machine learning'}. Review before payment.`);
    }catch(e){toast(e.message||'Analysis failed. Please check your connection.')}
    finally{state.loading=false;$('analyze-button').disabled=false;setText('analyze-label','✦   Analyze with AI')}
  }
  function openPayModal(id){
    if(!state.agreement)return;const m=state.agreement.milestones.find(x=>x.id===id);if(!m)return;
    state.selectedMilestone=m;setText('modal-milestone',`${m.name} · ${m.percent}% of total`);setText('modal-price',fmt(m.amount));
    setText('modal-description',state.status.paypalSandbox?'PayPal Sandbox is connected. You will be sent to PayPal to approve a test payment; no real funds move.':'PayPal Sandbox keys are not configured. You can test the explicitly simulated flow now, or set up sandbox credentials in the README.');
    $('confirm-payment').disabled=!state.status.paypalSandbox;
    $('confirm-payment').textContent=state.status.paypalSandbox?'Continue to PayPal Sandbox ↗':'Sandbox credentials needed';
    $('pay-modal').hidden=false;$('close-modal').focus();
  }
  function closePayModal(){$('pay-modal').hidden=true;state.selectedMilestone=null;}
  async function payViaPayPal(){
    const m=state.selectedMilestone;if(!m)return;
    $('confirm-payment').disabled=true;$('confirm-payment').textContent='Creating sandbox order…';
    try{
      const response=await fetch('/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:m.amount,title:`${state.agreement.title} — ${m.name}`})});
      const result=await response.json();if(!response.ok)throw new Error(result.message||'PayPal request failed.');
      sessionStorage.setItem('scopemint.pending',JSON.stringify({orderId:result.id,project:state.agreement.title,milestoneId:m.id,amount:m.amount}));
      if(!/^https:\/\/www\.sandbox\.paypal\.com\//.test(result.approvalUrl))throw new Error('Unexpected PayPal approval URL.');
      window.location.assign(result.approvalUrl);
    }catch(e){toast(e.message||'Checkout could not start.');$('confirm-payment').disabled=false;$('confirm-payment').textContent='Continue to PayPal Sandbox ↗'}
  }
  async function captureReturnedPayment(){
    const url=new URL(window.location.href);const marker=url.searchParams.get('paypal');if(!marker)return;
    window.history.replaceState({},'',url.pathname);
    if(marker==='cancel'){sessionStorage.removeItem('scopemint.pending');toast('PayPal Sandbox checkout was canceled. No capture occurred.');return;}
    const pending=safeSession('scopemint.pending');const orderId=url.searchParams.get('token');
    if(marker!=='return'||!pending||!orderId||pending.orderId!==orderId){toast('Could not match the returning order to this browser session. No capture attempted.');return;}
    try{
      const r=await fetch('/api/capture-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId})});
      const data=await r.json();if(!r.ok)throw new Error(data.message||'PayPal Sandbox capture could not be completed.');
      if(data.status!=='COMPLETED'||data.captureStatus!=='COMPLETED')throw new Error(`Sandbox order state: ${data.status}. Payment not recorded as completed.`);
      if(!state.agreement||state.agreement.title!==pending.project)throw new Error('Original agreement was not found in this browser; verify capture with PayPal.');
      const m=state.agreement.milestones.find(x=>x.id===pending.milestoneId);
      if(!m||Number(m.amount)!==Number(pending.amount))throw new Error('Milestone details changed; verify capture in the PayPal Sandbox dashboard.');
      savePaidAndActivity(m,'sandbox',data);sessionStorage.removeItem('scopemint.pending');
    }catch(e){toast(e.message||'Capture could not be confirmed. Check PayPal Sandbox before retrying.');}
  }
  function safeSession(key){try{return JSON.parse(sessionStorage.getItem(key))}catch{return null}}
  function simulatePayment(){const m=state.selectedMilestone;if(!m)return;const name=state.agreement.title;closePayModal();if(!state.agreement||state.agreement.title!==name)return;savePaidAndActivity(m,'simulation',null);}
  function buildAgreementText(){
    const a=state.agreement;if(!a)return '';
    return `SCOPEMINT AI — PROJECT AGREEMENT DRAFT\n\n${a.title}\n${a.category} · ${fmt(a.budget)} USD\n\n${a.summary}\n\n${a.milestones.map(m=>`${m.id}. ${m.name} — ${fmt(m.amount)} (${m.percent}%)\n${m.details}`).join('\n\n')}\n\nClarity score: ${a.score}/100\n${a.risks.map(r=>`Review: ${r.title} — ${r.detail}`).join('\n')}\n\nImportant: All payments require client approval. This is not an escrow service or a legally reviewed contract. Payments are PayPal Sandbox only.\n`;
  }
  async function copyAgreement(){if(!state.agreement){toast('Analyze a project before sharing an agreement.');return;}try{await navigator.clipboard.writeText(buildAgreementText());toast('Agreement draft copied to clipboard.')}catch{toast('Clipboard unavailable. You can export the agreement as JSON instead.')}}
  function exportAgreement(){if(!state.agreement){toast('Analyze a project before exporting.');return;}const safe=state.agreement.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,50);const file=new Blob([JSON.stringify({...state.agreement,disclaimer:'Draft only. No escrow. Sandbox payments only.'},null,2)],{type:'application/json'});const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=`scopemint-${safe||'agreement'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);toast('Agreement JSON exported.');}
  async function loadStatus(){try{const r=await fetch('/api/status');if(r.ok)state.status=await r.json()}catch{};setText('sandbox-label',state.status.paypalSandbox?'PayPal sandbox connected':'Sandbox keys not configured')}
  function setup(){
    state.agreement=safeLoad(KEY_AGREEMENT,null);state.activity=safeLoad(KEY_ACTIVITIES,[]);state.paid=safeLoad(KEY_PAID,{});
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
    document.querySelectorAll('[data-sample]').forEach(b=>b.addEventListener('click',()=>{const s=samples[b.dataset.sample];$('project-title').value=s.title;$('project-brief').value=s.brief;$('budget').value=s.budget;countChars();toast(`Loaded sample: ${s.title}. Click Analyze with AI.`)}));
    $('project-brief').addEventListener('input',countChars);$('analyze-button').addEventListener('click',analyze);
    $('copy-button').addEventListener('click',copyAgreement);$('download-button').addEventListener('click',exportAgreement);
    $('reader-button').addEventListener('click',()=>{const enabled=document.body.classList.toggle('reader-mode');$('reader-button').setAttribute('aria-pressed',String(enabled));toast(enabled?'Reading mode enabled.':'Standard text size restored.')});
    $('close-modal').addEventListener('click',closePayModal);$('cancel-payment').addEventListener('click',closePayModal);$('confirm-payment').addEventListener('click',payViaPayPal);$('simulate-payment').addEventListener('click',simulatePayment);
    $('pay-modal').addEventListener('click',e=>{if(e.target===$('pay-modal'))closePayModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('pay-modal').hidden)closePayModal()});
    countChars();renderInsights();renderAgreement();renderActivity();loadStatus().then(captureReturnedPayment);
    if(!state.agreement)analyze();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
