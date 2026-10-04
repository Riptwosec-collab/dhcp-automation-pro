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
      if(button){
        button.textContent='COPIED';
        button.dataset.copyState='ok';
        root.setTimeout(()=>{button.textContent=original;delete button.dataset.copyState;},1100);
      }
      return true;
    }catch(error){
      if(button){
        button.textContent='COPY FAILED';
        button.dataset.copyState='error';
        root.setTimeout(()=>{button.textContent=original;delete button.dataset.copyState;},1500);
      }
      console.error(error);
      return false;
    }
  }

  function cleanIncidentInput(rawText){
    const raw=String(rawText??'').replace(/\r\n?/g,'\n').replace(/<br\s*\/?\s*>/gi,'\n');
    const unwrap=line=>{
      let value=String(line??'').trim();
      if(!value)return '';
      if(/^\|?[\s:|-]+\|?$/.test(value)&&value.includes('-'))return '';
      if(value.startsWith('|'))value=value.slice(1).trim();
      if(value.endsWith('|'))value=value.slice(0,-1).trim();
      value=value.replace(/^\s*\t+|\t+\s*$/g,'').trim();
      return value;
    };
    const isWrapper=value=>/^(?:subject|request\s+detail)$/i.test(String(value||'').trim());
    const lines=raw.split('\n').map(unwrap).filter(value=>value&&!isWrapper(value));
    const marker=/^(?:monitor\b|url\s*:|hosted\s+on\b|(?:เวลา|time)\s*:)/i;
    const start=lines.findIndex(line=>marker.test(line));
    return (start>=0?lines.slice(start):lines).join('\n').trim();
  }

  function buildUrlStatusView(blocks,status='normal'){
    const selected=status==='abnormal'?'abnormal':'normal';
    const urlStatus=selected==='abnormal'?String(blocks?.urlAbnormal||''):String(blocks?.urlNormal||'');
    const monitorOriginal=String(blocks?.monitorOriginal||'');
    return {
      status:selected,
      urlStatus,
      combinedResolution:monitorOriginal&&urlStatus?`${monitorOriginal}\nแก้ไขโดย : ${urlStatus}`:monitorOriginal,
    };
  }

  function ownerDisplayName(owner){
    return String(owner?.name||'').trim();
  }

  function ownerMarkup(owner,index){
    const displayName=ownerDisplayName(owner);
    const phones=(owner.phones||[]).map(phone=>`<div class="tor-contact-row"><div><span>PHONE</span><code>${escapeHtml(phone)}</code></div>${copyButton('COPY PHONE',phone)}</div>`).join('');
    const emails=(owner.emails||[]).map(email=>`<div class="tor-contact-row"><div><span>EMAIL</span><code>${escapeHtml(email)}</code></div>${copyButton('COPY EMAIL',email)}</div>`).join('');
    const title=displayName||`Contact ${index+1}`;
    return `<article class="tor-owner"><div class="tor-owner-head"><div><span>${displayName?'OWNER':'CONTACT'} ${index+1}</span><h3>${escapeHtml(title)}</h3></div>${displayName?copyButton('COPY NAME',displayName):''}</div><div class="tor-owner-contact-list">${phones||'<div class="tor-contact-empty">PHONE · -</div>'}${emails||'<div class="tor-contact-empty">EMAIL · -</div>'}</div></article>`;
  }

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
    if(document.getElementById('torFinderEnhancements'))return;
    const core=root.TorSystemFinderCore;
    if(!core||typeof root.__torSystemFinderGetLastMatch!=='function')return;

    removeLegacyIncidentWaitingPanel();

    const input=document.getElementById('incidentInput');
    const analyze=document.getElementById('analyzeBtn');
    const result=document.getElementById('resultArea');
    const candidates=document.getElementById('candidateArea');
    if(!input||!analyze||!result||!candidates)return;

    const rootEl=document.createElement('section');
    rootEl.id='torFinderEnhancements';
    rootEl.className='tor-enhancements';
    rootEl.hidden=true;
    rootEl.innerHTML=`
      <section id="torOwners" class="tor-stage" hidden></section>
      <section id="torCopyBlocks" class="tor-stage" hidden></section>
      <section id="torMailDraft" class="tor-stage" hidden></section>`;
    candidates.insertAdjacentElement('afterend',rootEl);

    const ownersEl=document.getElementById('torOwners');
    const copyEl=document.getElementById('torCopyBlocks');
    const mailEl=document.getElementById('torMailDraft');
    let currentIncident=null;

    function hideEnhancements(){
      currentIncident=null;
      rootEl.hidden=true;
      ownersEl.hidden=true;
      copyEl.hidden=true;
      mailEl.hidden=true;
      ownersEl.innerHTML='';
      copyEl.innerHTML='';
      mailEl.innerHTML='';
    }

    function renderOwners(record){
      const normalized=core.normalizeTorRecords([record])[0];
      const owners=normalized?core.resolveOwners(normalized):[];
      ownersEl.hidden=false;
      ownersEl.innerHTML=`<div class="tor-stage-title"><strong>SYSTEM OWNERS</strong><span>${owners.length} owner/contact card(s) · Copy แยกทีละค่า</span></div>${owners.length?`<div class="tor-owner-grid">${owners.map(ownerMarkup).join('')}</div>`:'<div class="tor-no-match">NO OWNER CONTACT FOUND<small>ไม่พบข้อมูล Owner/Phone/Email ที่แยกได้จาก TOR record นี้</small></div>'}`;
    }

    function renderOperationalBlocks(incident,status='normal'){
      currentIncident=incident;
      const blocks=core.buildOperationalBlocks(incident);
      const view=buildUrlStatusView(blocks,status);
      const statusSelect=`<select id="torUrlStatus" aria-label="URL status"><option value="normal"${view.status==='normal'?' selected':''}>URL ปกติ</option><option value="abnormal"${view.status==='abnormal'?' selected':''}>URL ไม่ปกติ</option></select>`;
      const cards=[
        `<article class="tor-copy-card ${blocks.monitorOriginal?'':'is-disabled'}"><div class="tor-copy-card-head"><strong>MONITOR ORIGINAL</strong>${copyButton('COPY MONITOR',blocks.monitorOriginal)}</div><pre class="tor-copy-text">${escapeHtml(blocks.monitorOriginal||'ไม่มีข้อมูลสำหรับสร้างข้อความชุดนี้')}</pre></article>`,
        `<article class="tor-copy-card ${view.urlStatus?'':'is-disabled'}"><div class="tor-copy-card-head"><strong>URL STATUS</strong><div>${statusSelect}${copyButton('COPY URL STATUS',view.urlStatus)}</div></div><pre class="tor-copy-text">${escapeHtml(view.urlStatus||'ไม่มีข้อมูลสำหรับสร้างข้อความชุดนี้')}</pre></article>`,
        `<article class="tor-copy-card ${view.combinedResolution?'':'is-disabled'}"><div class="tor-copy-card-head"><strong>MONITOR + RESOLUTION</strong>${copyButton('COPY MONITOR + RESOLUTION',view.combinedResolution)}</div><pre class="tor-copy-text">${escapeHtml(view.combinedResolution||'ไม่มีข้อมูลสำหรับสร้างข้อความชุดนี้')}</pre></article>`,
        `<article class="tor-copy-card"><div class="tor-copy-card-head"><strong>MAIL COMPLETION</strong>${copyButton('COPY MAIL COMPLETION',blocks.mailCompletion)}</div><pre class="tor-copy-text">${escapeHtml(blocks.mailCompletion)}</pre></article>`,
      ];
      copyEl.hidden=false;
      copyEl.innerHTML=`<div class="tor-stage-title"><strong>OPERATION COPY BLOCKS</strong><span>4 ชุด · URL ปกติ/ไม่ปกติเลือกจาก Dropdown เดียว</span></div><div class="tor-copy-grid">${cards.join('')}</div>`;
    }

    function renderMailDraft(incident){
      const draft=core.buildMailDraft(incident,null);
      mailEl.hidden=false;
      mailEl.innerHTML=`<div class="tor-stage-title"><strong>MAIL DRAFT</strong><span>ใช้ Monitor + Incident ต้นฉบับ · ไม่ใส่ Owner อัตโนมัติ</span></div><article class="tor-mail-card"><div class="tor-copy-card-head"><strong>MAIL BODY</strong>${copyButton('COPY MAIL',draft)}</div><pre class="tor-mail-text">${escapeHtml(draft)}</pre></article>`;
    }

    function renderFromOriginalFinder(){
      const matchCard=result.querySelector('.match-card');
      const match=root.__torSystemFinderGetLastMatch();
      if(!matchCard||!match?.scored?.record){hideEnhancements();return;}
      const raw=input.value.trim();
      if(!raw){hideEnhancements();return;}
      const cleaned=cleanIncidentInput(raw);
      const incident=core.parseIncident(cleaned);
      renderOwners(match.scored.record);
      renderOperationalBlocks(incident,'normal');
      renderMailDraft(incident);
      rootEl.hidden=false;
    }

    let scheduled=false;
    function scheduleRender(){
      if(scheduled)return;
      scheduled=true;
      root.setTimeout(()=>{scheduled=false;renderFromOriginalFinder();},0);
    }

    const observer=new MutationObserver(scheduleRender);
    observer.observe(result,{childList:true,subtree:true});
    observer.observe(candidates,{childList:true,subtree:true});

    analyze.addEventListener('click',scheduleRender);
    input.addEventListener('input',()=>{
      if(!document.getElementById('autoAnalyze')?.checked)hideEnhancements();
    });

    rootEl.addEventListener('change',event=>{
      const selector=event.target.closest('#torUrlStatus');
      if(selector&&currentIncident)renderOperationalBlocks(currentIncident,event.target.value);
    });

    rootEl.addEventListener('click',event=>{
      const copy=event.target.closest('[data-copy-value]');
      if(copy)copyTorValue(decodeCopyValue(copy.dataset.copyValue),copy);
    });

    scheduleRender();
  }

  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
    else init();
  }

  return {createState,invalidateState,copyTorValue,cleanIncidentInput,buildUrlStatusView,removeLegacyIncidentWaitingPanel,init};
});
