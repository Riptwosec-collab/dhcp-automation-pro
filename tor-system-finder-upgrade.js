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

  function encodeCopyValue(value){return encodeURIComponent(String(value??''));}
  function decodeCopyValue(value){try{return decodeURIComponent(String(value||''));}catch(_error){return String(value||'');}}

  function copyButton(label,value,className='tor-copy-button'){
    if(!String(value??'').length)return '';
    return `<button type="button" class="${className}" data-copy-value="${escapeHtml(encodeCopyValue(value))}">${escapeHtml(label)}</button>`;
  }

  async function copyTorValue(text,button){
    const value=String(text??'');
    if(!value)return false;
    const original=button?.textContent||'';
    try{
      if(!root.navigator?.clipboard?.writeText)throw new Error('Clipboard API unavailable');
      await root.navigator.clipboard.writeText(value);
      if(button){button.textContent='COPIED';button.dataset.copyState='ok';root.setTimeout(()=>{button.textContent=original;delete button.dataset.copyState;},1100);}
      return true;
    }catch(error){
      if(button){button.textContent='COPY FAILED';button.dataset.copyState='error';root.setTimeout(()=>{button.textContent=original;delete button.dataset.copyState;},1500);}
      console.error(error);return false;
    }
  }

  function ownerDisplayName(owner){return [owner?.prefix,owner?.name].filter(Boolean).join(' ').trim()||'Contact';}
  function ownerContactText(owner){const lines=[ownerDisplayName(owner)];for(const phone of owner?.phones||[])lines.push(`เบอร์: ${phone}`);for(const email of owner?.emails||[])lines.push(`Email: ${email}`);return lines.join('\n');}
  function allContactsText(owners){return (owners||[]).map(ownerContactText).filter(Boolean).join('\n\n');}

  function removeLegacyIncidentWaitingPanel(){
    if(typeof document==='undefined')return null;
    const result=document.getElementById('resultArea');
    if(!result)return null;
    const sync=()=>{
      const idle=[...result.querySelectorAll('.idle-visual')].find(node=>node.textContent.includes('WAITING FOR INCIDENT DATA'));
      if(idle){
        idle.remove();
        result.classList.add('tor-legacy-idle-hidden');
        result.setAttribute('aria-hidden','true');
        return;
      }
      const hasContent=Boolean(result.children.length||result.textContent.trim());
      result.classList.toggle('tor-legacy-idle-hidden',!hasContent);
      if(hasContent)result.removeAttribute('aria-hidden');else result.setAttribute('aria-hidden','true');
    };
    const observer=new MutationObserver(sync);
    observer.observe(result,{childList:true,subtree:true});
    sync();
    return observer;
  }

  function init(){
    if(typeof document==='undefined')return;
    if(document.getElementById('torIncidentAnalyzer'))return;
    const core=root.TorSystemFinderCore;
    if(!core||typeof root.__torSystemFinderGetRecords!=='function')return;

    removeLegacyIncidentWaitingPanel();

    const mount=document.querySelector('.footer-note')?.parentElement||document.querySelector('.shell')||document.body;
    const rootEl=document.createElement('section');
    rootEl.id='torIncidentAnalyzer';
    rootEl.className='tor-upgrade';
    rootEl.innerHTML=`
      <div class="tor-upgrade-head">
        <div><span class="tor-kicker">TOR SYSTEM FINDER · INCIDENT WORKFLOW</span><h2>Analyze Monitor Error + Find System Owner</h2><p>ข้อมูลเดียวกับ Finder ด้านบน · วาง Error → Analyze → เลือกระบบ → Owner + Copy + Mail</p></div>
        <span class="tor-threshold">MATCH ≥ 80%</span>
      </div>
      <div class="tor-input-panel">
        <label for="torIncidentInput">MONITOR / ERROR INPUT</label>
        <textarea id="torIncidentInput" spellcheck="false" placeholder="Monitor ...\n\nUrl: https://...\nhosted on 10.x.x.x of ...\nเวลา : ..."></textarea>
        <div class="tor-actions"><button id="torAnalyzeError" type="button">ANALYZE ERROR</button><span id="torAnalyzeStatus">READY · PRESS ANALYZE ERROR</span></div>
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
    const legacyInput=document.getElementById('incidentInput');
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
      for(const element of [extracted,candidatesEl,selectedEl,ownersEl,copyEl,mailEl])element.hidden=true;
      extracted.querySelector('.tor-field-grid').innerHTML='';
      candidatesEl.querySelector('.tor-candidate-list').innerHTML='';
      selectedEl.innerHTML=''; ownersEl.innerHTML=''; copyEl.innerHTML=''; mailEl.innerHTML='';
    }

    function syncFromLegacyInput(){
      if(!legacyInput||legacyInput.value===input.value)return;
      input.value=legacyInput.value;
      state=invalidateState(state,input.value);
      resetDownstream();
      status.textContent=input.value.trim()?'SYNCED FROM FINDER · PRESS ANALYZE ERROR':'READY · PRESS ANALYZE ERROR';
    }
    if(legacyInput){syncFromLegacyInput();legacyInput.addEventListener('input',syncFromLegacyInput);}

    function renderExtracted(incident){
      const fields=[['MONITOR',incident.monitor],['SYSTEM / SERVICE',incident.systemName],['URL',incident.url],['HOST',incident.host],['DOMAIN',incident.domain],['IP',incident.ip],['ERROR',incident.error],['TIME',incident.time]];
      extracted.querySelector('.tor-field-grid').innerHTML=fields.map(([label,value])=>`<div class="tor-field"><label>${label}</label><div>${escapeHtml(value||'-')}</div></div>`).join('');
      extracted.hidden=false;
    }

    function evidenceMarkup(items){return items.map(item=>`<div class="tor-evidence ${item.matched?'is-match':'is-miss'}"><div class="tor-evidence-head"><strong>${escapeHtml(item.field)}</strong><span>${item.contribution?`+${item.contribution}`:'0'}</span></div><div><b>Incident</b><code>${escapeHtml(item.incidentValue||'-')}</code></div><div><b>TOR</b><code>${escapeHtml(item.torValue||'-')}</code></div><small>${escapeHtml(item.note||'')}</small></div>`).join('');}

    function renderCandidates(){
      candidatesEl.hidden=false;
      const list=candidatesEl.querySelector('.tor-candidate-list');
      if(!state.candidates.length){list.innerHTML='<div class="tor-no-match">NO RELIABLE TOR MATCH >= 80%<small>ไม่พบระบบที่มีหลักฐานเพียงพอ ระบบจะไม่เลือกแทนผู้ใช้</small></div>';return;}
      list.innerHTML=state.candidates.map((candidate,index)=>`<article class="tor-candidate" data-score="${candidate.score}"><div class="tor-candidate-top"><div><span>CANDIDATE ${index+1}</span><h3>${escapeHtml(candidate.record.systemName||'-')}</h3></div><div class="tor-score">MATCH <strong>${candidate.score}%</strong><small>${escapeHtml(candidate.matchMode)}</small></div></div><div class="tor-evidence-grid">${evidenceMarkup(candidate.evidence)}</div><button type="button" class="tor-select" data-candidate-index="${index}">SELECT THIS SYSTEM</button></article>`).join('');
    }

    function ownerMarkup(owner,index){
      const displayName=ownerDisplayName(owner);
      const phones=(owner.phones||[]).map(phone=>`<div class="tor-contact-row"><div><span>PHONE</span><code>${escapeHtml(phone)}</code></div>${copyButton('COPY PHONE',phone)}</div>`).join('');
      const emails=(owner.emails||[]).map(email=>`<div class="tor-contact-row"><div><span>EMAIL</span><code>${escapeHtml(email)}</code></div>${copyButton('COPY EMAIL',email)}</div>`).join('');
      return `<article class="tor-owner"><div class="tor-owner-head"><div><span>OWNER ${index+1}</span><h3>${escapeHtml(displayName)}</h3></div>${copyButton('COPY NAME',displayName)}</div><div class="tor-owner-contact-list">${phones||'<div class="tor-contact-empty">PHONE · -</div>'}${emails||'<div class="tor-contact-empty">EMAIL · -</div>'}</div></article>`;
    }

    function renderOperationalBlocks(){
      const blocks=core.buildOperationalBlocks(state.incident);
      const items=[['MONITOR + RESOLUTION',blocks.combinedResolution,'COPY MONITOR + RESOLUTION'],['URL NORMAL',blocks.urlNormal,'COPY URL NORMAL'],['URL ABNORMAL',blocks.urlAbnormal,'COPY URL ABNORMAL'],['TICKET ACTION',blocks.ticketAction,'COPY TICKET ACTION'],['MAIL COMPLETION',blocks.mailCompletion,'COPY MAIL COMPLETION']];
      copyEl.hidden=false;
      copyEl.innerHTML=`<div class="tor-stage-title"><strong>OPERATION COPY BLOCKS</strong><span>Copy แยกได้ทีละชุด · ข้อความแสดงเต็ม</span></div><div class="tor-copy-grid">${items.map(([label,value,buttonLabel])=>`<article class="tor-copy-card ${value?'':'is-disabled'}"><div class="tor-copy-card-head"><strong>${escapeHtml(label)}</strong>${copyButton(buttonLabel,value)}</div><pre class="tor-copy-text">${escapeHtml(value||'ไม่มี URL สำหรับสร้างข้อความชุดนี้')}</pre></article>`).join('')}</div>`;
    }

    function renderMailDraft(){const draft=core.buildMailDraft(state.incident,state.selectedRecord);mailEl.hidden=false;mailEl.innerHTML=`<div class="tor-stage-title"><strong>MAIL DRAFT</strong><span>ข้อความพร้อม Copy · ผู้ดูแล/Email แยกอยู่ด้านบน</span></div><article class="tor-mail-card"><div class="tor-copy-card-head"><strong>MAIL BODY</strong>${copyButton('COPY MAIL',draft)}</div><pre class="tor-mail-text">${escapeHtml(draft)}</pre></article>`;}

    function renderSelection(candidate){
      selectedEl.hidden=false;
      selectedEl.innerHTML=`<div class="tor-selected"><span>SELECTED SYSTEM</span><strong>${escapeHtml(candidate.record.systemName||'-')}</strong><b>MATCH ${candidate.score}%</b></div>`;
      ownersEl.hidden=false;
      const owners=state.owners,allContacts=allContactsText(owners);
      ownersEl.innerHTML=`<div class="tor-stage-title"><strong>MATCHED SYSTEM OWNERS</strong><span>${owners.length} owner(s) จาก TOR record ที่เลือก</span></div>${owners.length?`<div class="tor-owner-actions">${copyButton('COPY ALL CONTACTS',allContacts,'tor-copy-button tor-copy-all')}</div><div class="tor-owner-grid">${owners.map(ownerMarkup).join('')}</div>`:'<div class="tor-no-match">NO OWNER CONTACT FOUND</div>'}`;
      renderOperationalBlocks();renderMailDraft();
    }

    function analyzeError(){
      const raw=input.value.trim();
      if(!raw){state=invalidateState(state,'');resetDownstream();status.textContent='ERROR INPUT REQUIRED';return;}
      state={...createState(),phase:'analyzing',raw};status.textContent='ANALYZING…';
      try{
        const incident=core.parseIncident(raw);
        const records=core.normalizeTorRecords(root.__torSystemFinderGetRecords());
        const candidates=core.findCandidates(incident,records);
        state={...state,phase:candidates.length?'candidates':'no-reliable-match',incident,candidates};
        renderExtracted(incident);renderCandidates();selectedEl.hidden=true;ownersEl.hidden=true;copyEl.hidden=true;mailEl.hidden=true;
        status.textContent=candidates.length?`${candidates.length} CANDIDATE(S) · SELECT ONE`:'NO RELIABLE MATCH';
      }catch(error){state=invalidateState(state,raw);resetDownstream();status.textContent='ANALYZE FAILED';console.error(error);}
    }

    input.addEventListener('input',()=>{state=invalidateState(state,input.value);resetDownstream();status.textContent=input.value.trim()?'CHANGED · PRESS ANALYZE ERROR':'READY · PRESS ANALYZE ERROR';});
    analyze.addEventListener('click',analyzeError);
    rootEl.addEventListener('click',event=>{
      const copy=event.target.closest('[data-copy-value]');if(copy){copyTorValue(decodeCopyValue(copy.dataset.copyValue),copy);return;}
      const button=event.target.closest('[data-candidate-index]');if(!button)return;
      const candidate=state.candidates[Number(button.dataset.candidateIndex)];if(!candidate)return;
      state={...state,phase:'ready',selectedRecord:candidate.record,owners:core.resolveOwners(candidate.record)};renderSelection(candidate);status.textContent='SYSTEM SELECTED · OWNER + COPY OUTPUTS READY';
    });
  }

  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
  return {createState,invalidateState,copyTorValue,removeLegacyIncidentWaitingPanel,init};
});
