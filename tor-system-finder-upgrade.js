(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TorSystemFinderUpgrade=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  function createState(){
    return {phase:'idle',raw:'',incident:null,candidates:[],selectedRecord:null,owners:[]};
  }

  function invalidateState(state,raw){
    return {phase:'idle',raw:String(raw??state?.raw??''),incident:null,candidates:[],selectedRecord:null,owners:[]};
  }

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function init(){
    if(typeof document==='undefined')return;
    if(document.getElementById('torIncidentAnalyzer'))return;
    const core=root.TorSystemFinderCore;
    if(!core||typeof root.__torSystemFinderGetRecords!=='function')return;

    const mount=document.querySelector('.footer-note')?.parentElement||document.querySelector('.shell')||document.body;
    const rootEl=document.createElement('section');
    rootEl.id='torIncidentAnalyzer';
    rootEl.className='tor-upgrade';
    rootEl.innerHTML=`
      <div class="tor-upgrade-head">
        <div><span class="tor-kicker">TOR SYSTEM FINDER · INCIDENT WORKFLOW</span><h2>Analyze Monitor Error + Find System Owner</h2><p>วาง Error ทั้งก้อน → กด Analyze → ตรวจ Candidate → เลือกระบบ → ดูผู้ดูแลทั้งหมด</p></div>
        <span class="tor-threshold">MATCH ≥ 80%</span>
      </div>
      <div class="tor-input-panel">
        <label for="torIncidentInput">MONITOR / ERROR INPUT</label>
        <textarea id="torIncidentInput" spellcheck="false" placeholder="Monitor ...\n\nUrl: https://...\nhosted on 10.x.x.x of ...\nเวลา : ..."></textarea>
        <div class="tor-actions"><button id="torAnalyzeError" type="button">ANALYZE ERROR</button><span id="torAnalyzeStatus">WAITING FOR ERROR</span></div>
      </div>
      <section id="torExtractedFields" class="tor-stage" hidden><div class="tor-stage-title"><strong>EXTRACTED INCIDENT</strong><span>ค่าที่ตรวจพบจากข้อความต้นฉบับ</span></div><div class="tor-field-grid"></div></section>
      <section id="torCandidates" class="tor-stage" hidden><div class="tor-stage-title"><strong>SYSTEM CANDIDATES</strong><span>แสดงเฉพาะ MATCH ≥ 80% · ต้องเลือกเอง</span></div><div class="tor-candidate-list"></div></section>
      <section id="torSelectedSystem" class="tor-stage" hidden></section>
      <section id="torOwners" class="tor-stage" hidden></section>
      <section id="torCopyBlocks" class="tor-stage" hidden></section>
      <section id="torMailDraft" class="tor-stage" hidden></section>`;

    const footer=document.querySelector('.footer-note');
    if(footer&&footer.parentElement===mount)mount.insertBefore(rootEl,footer);else mount.appendChild(rootEl);

    const input=document.getElementById('torIncidentInput');
    const analyze=document.getElementById('torAnalyzeError');
    const status=document.getElementById('torAnalyzeStatus');
    const extracted=document.getElementById('torExtractedFields');
    const candidatesEl=document.getElementById('torCandidates');
    const selectedEl=document.getElementById('torSelectedSystem');
    const ownersEl=document.getElementById('torOwners');
    const copyEl=document.getElementById('torCopyBlocks');
    const mailEl=document.getElementById('torMailDraft');
    let state=createState();

    function resetDownstream(){
      for(const element of [extracted,candidatesEl,selectedEl,ownersEl,copyEl,mailEl]){
        element.hidden=true;
      }
      extracted.querySelector('.tor-field-grid').innerHTML='';
      candidatesEl.querySelector('.tor-candidate-list').innerHTML='';
      selectedEl.innerHTML=''; ownersEl.innerHTML=''; copyEl.innerHTML=''; mailEl.innerHTML='';
    }

    function renderExtracted(incident){
      const fields=[
        ['MONITOR',incident.monitor],['SYSTEM / SERVICE',incident.systemName],['URL',incident.url],
        ['HOST',incident.host],['DOMAIN',incident.domain],['IP',incident.ip],['ERROR',incident.error],['TIME',incident.time],
      ];
      extracted.querySelector('.tor-field-grid').innerHTML=fields.map(([label,value])=>`<div class="tor-field"><label>${label}</label><div>${escapeHtml(value||'-')}</div></div>`).join('');
      extracted.hidden=false;
    }

    function evidenceMarkup(items){
      return items.map(item=>`<div class="tor-evidence ${item.matched?'is-match':'is-miss'}"><div class="tor-evidence-head"><strong>${escapeHtml(item.field)}</strong><span>${item.contribution?`+${item.contribution}`:'0'}</span></div><div><b>Incident</b><code>${escapeHtml(item.incidentValue||'-')}</code></div><div><b>TOR</b><code>${escapeHtml(item.torValue||'-')}</code></div><small>${escapeHtml(item.note||'')}</small></div>`).join('');
    }

    function renderCandidates(){
      candidatesEl.hidden=false;
      const list=candidatesEl.querySelector('.tor-candidate-list');
      if(!state.candidates.length){
        list.innerHTML='<div class="tor-no-match">NO RELIABLE TOR MATCH >= 80%<small>ไม่พบระบบที่มีหลักฐานเพียงพอ ระบบจะไม่เลือกแทนผู้ใช้</small></div>';
        return;
      }
      list.innerHTML=state.candidates.map((candidate,index)=>`<article class="tor-candidate" data-score="${candidate.score}"><div class="tor-candidate-top"><div><span>CANDIDATE ${index+1}</span><h3>${escapeHtml(candidate.record.systemName||'-')}</h3></div><div class="tor-score">MATCH <strong>${candidate.score}%</strong><small>${escapeHtml(candidate.matchMode)}</small></div></div><div class="tor-evidence-grid">${evidenceMarkup(candidate.evidence)}</div><button type="button" class="tor-select" data-candidate-index="${index}">SELECT THIS SYSTEM</button></article>`).join('');
    }

    function renderSelection(candidate){
      selectedEl.hidden=false;
      selectedEl.innerHTML=`<div class="tor-selected"><span>SELECTED SYSTEM</span><strong>${escapeHtml(candidate.record.systemName||'-')}</strong><b>MATCH ${candidate.score}%</b></div>`;
      ownersEl.hidden=false;
      const owners=state.owners;
      ownersEl.innerHTML=`<div class="tor-stage-title"><strong>MATCHED SYSTEM OWNERS</strong><span>${owners.length} owner(s) จาก TOR record ที่เลือก</span></div>${owners.length?`<div class="tor-owner-grid">${owners.map((owner,index)=>`<article class="tor-owner"><span>OWNER ${index+1}</span><h3>${escapeHtml([owner.prefix,owner.name].filter(Boolean).join(' ')||'Contact')}</h3><div><b>PHONE</b> ${escapeHtml(owner.phones.join(' · ')||'-')}</div><div><b>EMAIL</b> ${escapeHtml(owner.emails.join(' · ')||'-')}</div></article>`).join('')}</div>`:'<div class="tor-no-match">NO OWNER CONTACT FOUND</div>'}`;
    }

    function analyzeError(){
      const raw=input.value.trim();
      if(!raw){
        state=invalidateState(state,''); resetDownstream(); status.textContent='ERROR INPUT REQUIRED'; return;
      }
      state={...createState(),phase:'analyzing',raw};
      status.textContent='ANALYZING…';
      try{
        const incident=core.parseIncident(raw);
        const records=core.normalizeTorRecords(root.__torSystemFinderGetRecords());
        const candidates=core.findCandidates(incident,records);
        state={...state,phase:candidates.length?'candidates':'no-reliable-match',incident,candidates};
        renderExtracted(incident);
        renderCandidates();
        selectedEl.hidden=true; ownersEl.hidden=true; copyEl.hidden=true; mailEl.hidden=true;
        status.textContent=candidates.length?`${candidates.length} CANDIDATE(S) · SELECT ONE`:'NO RELIABLE MATCH';
      }catch(error){
        state=invalidateState(state,raw); resetDownstream(); status.textContent='ANALYZE FAILED';
        console.error(error);
      }
    }

    input.addEventListener('input',()=>{
      state=invalidateState(state,input.value);
      resetDownstream();
      status.textContent=input.value.trim()?'CHANGED · PRESS ANALYZE ERROR':'WAITING FOR ERROR';
    });
    analyze.addEventListener('click',analyzeError);
    candidatesEl.addEventListener('click',event=>{
      const button=event.target.closest('[data-candidate-index]');
      if(!button)return;
      const candidate=state.candidates[Number(button.dataset.candidateIndex)];
      if(!candidate)return;
      state={...state,phase:'ready',selectedRecord:candidate.record,owners:core.resolveOwners(candidate.record)};
      renderSelection(candidate);
      status.textContent='SYSTEM SELECTED · OWNER DATA READY';
    });
  }

  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  }

  return {createState,invalidateState,init};
});
