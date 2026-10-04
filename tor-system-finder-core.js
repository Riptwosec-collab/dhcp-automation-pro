(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TorSystemFinderCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function cleanSpaces(value){
    return String(value||'').replace(/\r\n?/g,'\n').replace(/[ \t]+/g,' ').trim();
  }

  function normalizeUrlEscapes(value){
    return String(value||'')
      .replace(/https?\\:\/\//gi,m=>m.replace('\\:',':'))
      .replace(/\\\//g,'/');
  }

  function trimBlankEdges(lines){
    const copy=[...lines];
    while(copy.length&&!String(copy[0]).trim())copy.shift();
    while(copy.length&&!String(copy[copy.length-1]).trim())copy.pop();
    return copy;
  }

  function extractRawIncidentParts(rawText){
    const raw=String(rawText||'').replace(/\r\n?/g,'\n');
    const lines=raw.split('\n');
    const monitorStart=lines.findIndex(line=>/^\s*monitor\b/i.test(line));
    if(monitorStart<0){
      return {monitorRaw:'',incidentRaw:trimBlankEdges(lines).join('\n')};
    }
    const marker=/^\s*(?:url\s*:|hosted\s+on\b|(?:เวลา|time)\s*:)/i;
    let monitorEnd=monitorStart+1;
    while(monitorEnd<lines.length&&!marker.test(lines[monitorEnd]))monitorEnd++;
    const monitorRaw=trimBlankEdges(lines.slice(monitorStart,monitorEnd)).join('\n').trim();
    const remaining=[...lines.slice(0,monitorStart),...lines.slice(monitorEnd)];
    const incidentRaw=trimBlankEdges(remaining).join('\n');
    return {monitorRaw,incidentRaw};
  }

  function deriveDomain(host){
    const value=String(host||'').toLowerCase().replace(/^\.+|\.+$/g,'');
    if(!value)return '';
    const parts=value.split('.').filter(Boolean);
    if(parts.length<=2)return value;
    const thaiSecondLevel=new Set(['ac.th','co.th','go.th','in.th','mi.th','net.th','or.th']);
    const tail2=parts.slice(-2).join('.');
    return thaiSecondLevel.has(tail2)&&parts.length>=3?parts.slice(-3).join('.'):tail2;
  }

  function normalizeSystemName(text){
    let value=cleanSpaces(text)
      .replace(/^monitor\s*[:\-]?\s*/i,'')
      .replace(/\s*(?:ไม่สามารถเรียกใช้งานได้|ไม่สามารถใช้งานได้|cannot\s+(?:be\s+)?accessed|unavailable)\s*$/i,'')
      .trim();
    return value.replace(/\s+/g,' ');
  }

  function comparableSystemName(text){
    return normalizeSystemName(text)
      .toLowerCase()
      .replace(/[\u200b\u200c\u200d]/g,'')
      .replace(/[^0-9a-zก-๙]+/gi,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function levenshtein(a,b){
    const left=Array.from(a),right=Array.from(b);
    if(!left.length)return right.length;
    if(!right.length)return left.length;
    let prev=Array.from({length:right.length+1},(_,i)=>i);
    for(let i=1;i<=left.length;i++){
      const cur=[i];
      for(let j=1;j<=right.length;j++){
        const cost=left[i-1]===right[j-1]?0:1;
        cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+cost);
      }
      prev=cur;
    }
    return prev[right.length];
  }

  function systemNameSimilarity(a,b){
    const left=comparableSystemName(a),right=comparableSystemName(b);
    if(!left||!right)return 0;
    if(left===right)return 100;
    const maxLen=Math.max(Array.from(left).length,Array.from(right).length);
    const charScore=maxLen?Math.max(0,1-levenshtein(left,right)/maxLen):0;
    const aTokens=new Set(left.split(' ').filter(Boolean));
    const bTokens=new Set(right.split(' ').filter(Boolean));
    let intersection=0;
    for(const token of aTokens)if(bTokens.has(token))intersection++;
    const union=new Set([...aTokens,...bTokens]).size;
    const tokenScore=union?intersection/union:0;
    return Math.max(0,Math.min(100,Math.round((charScore*0.7+tokenScore*0.3)*100)));
  }

  function parseIncident(rawText){
    const raw=String(rawText||'');
    const rawParts=extractRawIncidentParts(raw);
    const normalized=normalizeUrlEscapes(raw).replace(/\r\n?/g,'\n');
    const lines=normalized.split('\n').map(line=>line.trim()).filter(Boolean);

    const monitorStart=lines.findIndex(line=>/^monitor\b/i.test(line));
    const monitorMarker=/^(?:url\s*:|hosted\s+on\b|(?:เวลา|time)\s*:)/i;
    const monitorLines=[];
    if(monitorStart>=0){
      for(let i=monitorStart;i<lines.length;i++){
        const line=lines[i];
        if(i>monitorStart&&monitorMarker.test(line))break;
        monitorLines.push(i===monitorStart?line.replace(/^monitor\s*[:\-]?\s*/i,''):line);
      }
    }
    const monitor=monitorLines.join(' ').replace(/\s+/g,' ').trim();

    const urlLabelMatch=normalized.match(/(?:^|\n)\s*(?:url)\s*:\s*(https?:\/\/[^\s]+)/i);
    const genericUrlMatch=normalized.match(/https?:\/\/[^\s]+/i);
    const url=(urlLabelMatch?.[1]||genericUrlMatch?.[0]||'').replace(/[),.;]+$/,'');

    let host='';
    if(url){
      try{host=new URL(url).hostname.toLowerCase();}catch(_error){host='';}
    }

    const hostedMatch=normalized.match(/hosted\s+on\s+([^\s]+)\s+of\s+([^\n]+)/i);
    const hostedTarget=hostedMatch?hostedMatch[1].trim():'';
    const hostedIp=/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostedTarget)?hostedTarget:'';
    const anyIpMatch=normalized.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
    const ip=hostedIp||(anyIpMatch?anyIpMatch[0]:'');
    if(!host&&hostedTarget&&!hostedIp)host=hostedTarget.toLowerCase().replace(/[),.;]+$/,'');

    const error=hostedMatch?cleanSpaces(hostedMatch[2]):'';
    const timeMatch=normalized.match(/(?:^|\n)\s*(?:เวลา|time)\s*:\s*([^\n]+)/i);
    const time=timeMatch?cleanSpaces(timeMatch[1]):'';

    return {
      raw,
      monitor,
      monitorRaw:rawParts.monitorRaw,
      incidentRaw:rawParts.incidentRaw,
      systemName:normalizeSystemName(monitor),
      url,
      host,
      domain:deriveDomain(host),
      ip,
      error,
      time,
    };
  }

  function normalizedList(values,transform){
    const list=Array.isArray(values)?values:values?[values]:[];
    const output=[];
    const seen=new Set();
    for(const value of list){
      const normalized=(transform?transform(value):cleanSpaces(value));
      if(!normalized||seen.has(normalized))continue;
      seen.add(normalized);
      output.push(normalized);
    }
    return output;
  }

  function extractAll(value,regexp,transform){
    const text=String(value||'');
    const matches=[];
    for(const match of text.matchAll(regexp)){
      const found=match[0];
      const normalized=transform?transform(found):found;
      if(normalized)matches.push(normalized);
    }
    return matches;
  }

  function unique(values){
    const seen=new Set();
    return values.filter(value=>{
      if(!value||seen.has(value))return false;
      seen.add(value);
      return true;
    });
  }

  function normalizePhone(value){
    return cleanSpaces(value).replace(/\s+/g,'');
  }

  function splitOwnerName(value){
    let text=cleanSpaces(value)
      .replace(/^[,;:/\-]+|[,;:/\-]+$/g,'')
      .replace(/^(?:โทร|โทรศัพท์|เบอร์|phone|email|e-mail)\s*[:\-]?\s*/i,'')
      .trim();
    if(!text)return null;
    const prefixMatch=text.match(/^(?:(?:นางสาว|น\.ส\.?|นาย|นาง|คุณ|อาจารย์)\s*|(?:ดร|ผศ|รศ|ศ)(?:\.\s*|\s+))+/i);
    const prefix=prefixMatch?prefixMatch[0].trim():'';
    if(prefixMatch)text=text.slice(prefixMatch[0].length).trim();
    const words=text.split(/\s+/).filter(Boolean);
    if(words.length<2)return null;
    if(!/[ก-๙A-Za-z]/.test(text))return null;
    return {prefix,name:words.join(' ')};
  }

  function parseOwners(contactRaw,recordId){
    const raw=String(contactRaw||'').trim();
    if(!raw)return [];
    const emailRe=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const phoneRe=/(?<!\d)(?:\+66[\s-]?|0)\d(?:[\s-]?\d){7,10}(?!\d)/g;
    const chunks=raw.split(/[;,\n]+/).map(cleanSpaces).filter(Boolean);
    const owners=[];
    let currentOwner=null;

    function addContacts(owner,phones,emails){
      owner.phones=unique([...(owner.phones||[]),...phones]);
      owner.emails=unique([...(owner.emails||[]),...emails]);
    }

    for(const chunk of chunks){
      const emails=extractAll(chunk,emailRe,value=>value.trim());
      const phones=extractAll(chunk,phoneRe,normalizePhone);
      const stripped=chunk
        .replace(emailRe,' ')
        .replace(phoneRe,' ')
        .replace(/\s+/g,' ')
        .trim();
      const ownerName=splitOwnerName(stripped);
      if(ownerName){
        const owner={
          id:`${recordId??'record'}:owner:${owners.length+1}`,
          kind:'owner',
          prefix:ownerName.prefix,
          name:ownerName.name,
          phones:[],
          emails:[],
          raw:chunk,
        };
        addContacts(owner,phones,emails);
        owners.push(owner);
        currentOwner=owner;
      }else if(phones.length||emails.length){
        if(currentOwner){
          addContacts(currentOwner,phones,emails);
          currentOwner.raw=[currentOwner.raw,chunk].filter(Boolean).join(', ');
        }else{
          owners.push({
            id:`${recordId??'record'}:contact:${owners.length+1}`,
            kind:'unassigned',
            prefix:'',
            name:'',
            phones:unique(phones),
            emails:unique(emails),
            raw:chunk,
          });
        }
      }
    }

    if(!owners.length){
      const phones=unique(extractAll(raw,phoneRe,normalizePhone));
      const emails=unique(extractAll(raw,emailRe,value=>value.trim()));
      if(phones.length||emails.length){
        owners.push({
          id:`${recordId??'record'}:contact:1`,
          kind:'unassigned',
          prefix:'',
          name:'',
          phones,
          emails,
          raw,
        });
      }
      return owners;
    }

    return owners.map(owner=>({
      ...owner,
      phones:unique(owner.phones),
      emails:unique(owner.emails),
    }));
  }

  function extractUrls(value){
    return unique(extractAll(normalizeUrlEscapes(value),/https?:\/\/[^\s,;]+/gi,url=>url.replace(/[)\].,;]+$/,'')));
  }

  function extractIps(value){
    return unique(extractAll(value,/\b(?:\d{1,3}\.){3}\d{1,3}\b/g,ip=>ip));
  }

  function normalizeTorRecords(sourceRecords){
    const records=Array.isArray(sourceRecords)?sourceRecords:[];
    return records.map((raw,index)=>{
      const source=raw&&typeof raw==='object'?raw:{};
      const urls=extractUrls(source.url||source.urls||'');
      const hosts=unique(urls.map(url=>{
        try{return new URL(url).hostname.toLowerCase();}catch(_error){return '';}
      }).filter(Boolean));
      const domains=unique(hosts.map(deriveDomain).filter(Boolean));
      const ips=extractIps(source.ip||source.ips||'');
      const id=source.id??index+1;
      const owners=parseOwners(source.contactRaw||'',id);
      return {
        id,
        systemName:cleanSpaces(source.systemName||''),
        ips,
        urls,
        hosts,
        domains,
        owners,
        raw:{...source},
      };
    });
  }

  function resolveOwners(record){
    const owners=Array.isArray(record?.owners)?record.owners:parseOwners(record?.raw?.contactRaw||record?.contactRaw||'',record?.id);
    return owners.map((owner,index)=>({
      id:owner.id||`${record?.id??'record'}:owner:${index+1}`,
      kind:owner.kind||(cleanSpaces(owner.name||'')?'owner':'unassigned'),
      prefix:cleanSpaces(owner.prefix||''),
      name:cleanSpaces(owner.name||''),
      phones:unique(normalizedList(owner.phones,normalizePhone)),
      emails:unique(normalizedList(owner.emails,value=>String(value||'').trim())),
      raw:String(owner.raw||record?.raw?.contactRaw||record?.contactRaw||''),
    }));
  }

  function evidence(field,incidentValue,torValue,matched,contribution,note){
    return {field,incidentValue:String(incidentValue||''),torValue:String(torValue||''),matched:Boolean(matched),contribution:Number(contribution||0),note:String(note||'')};
  }

  function scoreCandidate(incident,record){
    const ips=normalizedList(record?.ips);
    const hosts=normalizedList(record?.hosts,value=>String(value||'').toLowerCase().trim());
    const domains=normalizedList(record?.domains,value=>String(value||'').toLowerCase().trim());
    const incidentIp=String(incident?.ip||'').trim();
    const incidentHost=String(incident?.host||'').toLowerCase().trim();
    const incidentDomain=String(incident?.domain||deriveDomain(incidentHost)||'').toLowerCase().trim();
    const systemName=String(record?.systemName||'');
    const nameSimilarity=systemNameSimilarity(incident?.systemName||'',systemName);

    const exactIp=Boolean(incidentIp&&ips.includes(incidentIp));
    const exactHost=Boolean(incidentHost&&hosts.includes(incidentHost));
    const exactDomain=Boolean(incidentDomain&&domains.includes(incidentDomain));
    const resultEvidence=[];

    resultEvidence.push(evidence('IP',incidentIp,exactIp?incidentIp:ips.join(', '),exactIp,exactIp?100:0,exactIp?'EXACT IP':'NOT EXACT'));

    if(exactIp){
      resultEvidence.push(evidence('Host',incidentHost,hosts.join(', '),exactHost,0,exactHost?'EXACT HOST':'NOT USED'));
      resultEvidence.push(evidence('System Name',incident?.systemName||'',systemName,nameSimilarity===100,0,`Similarity ${nameSimilarity}% · not used because IP is exact`));
      return {record,score:100,matchMode:'ip-exact',evidence:resultEvidence};
    }

    if(exactHost){
      const nameContribution=Math.round(nameSimilarity*0.40);
      resultEvidence.push(evidence('Host',incidentHost,incidentHost,true,60,'EXACT HOST +60'));
      resultEvidence.push(evidence('System Name',incident?.systemName||'',systemName,nameSimilarity===100,nameContribution,`Similarity ${nameSimilarity}% -> +${nameContribution}/40`));
      return {record,score:Math.min(100,60+nameContribution),matchMode:'host-name',evidence:resultEvidence};
    }

    if(exactDomain){
      const nameContribution=Math.round(nameSimilarity*0.70);
      resultEvidence.push(evidence('Host',incidentHost,hosts.join(', '),false,0,'HOST NOT EXACT'));
      resultEvidence.push(evidence('Domain',incidentDomain,incidentDomain,true,30,'DOMAIN MATCH +30'));
      resultEvidence.push(evidence('System Name',incident?.systemName||'',systemName,nameSimilarity===100,nameContribution,`Similarity ${nameSimilarity}% -> +${nameContribution}/70`));
      return {record,score:Math.min(100,30+nameContribution),matchMode:'domain-name',evidence:resultEvidence};
    }

    resultEvidence.push(evidence('Host',incidentHost,hosts.join(', '),false,0,'HOST NOT EXACT'));
    resultEvidence.push(evidence('Domain',incidentDomain,domains.join(', '),false,0,'DOMAIN NOT MATCHED'));
    resultEvidence.push(evidence('System Name',incident?.systemName||'',systemName,nameSimilarity===100,0,`Similarity ${nameSimilarity}% · no Host/Domain base score`));
    return {record,score:0,matchMode:'none',evidence:resultEvidence};
  }

  function findCandidates(incident,records){
    const list=Array.isArray(records)?records:[];
    const exact=[];
    for(let index=0;index<list.length;index++){
      const candidate=scoreCandidate(incident,list[index]);
      if(candidate.matchMode==='ip-exact')exact.push({...candidate,_index:index});
    }
    if(exact.length)return exact.map(({_index,...candidate})=>candidate);

    return list
      .map((record,index)=>({...scoreCandidate(incident,record),_index:index}))
      .filter(candidate=>candidate.score>=80)
      .sort((a,b)=>b.score-a.score||a._index-b._index)
      .map(({_index,...candidate})=>candidate);
  }

  function buildOperationalBlocks(incident){
    const monitor=String(incident?.monitor||'').trim();
    const monitorOriginal=String(incident?.monitorRaw||'').trim()||(monitor?`Monitor ${monitor}`:'');
    const url=String(incident?.url||'').trim();
    const urlNormal=url?`ตรวจสอบสามารถใช้งาน Url: ${url} ได้ปกติ`:'';
    const urlAbnormal=url?`ตรวจสอบไม่สามารถใช้งาน Url: ${url} ได้ปกติ`:'';
    return {
      monitorOriginal,
      combinedResolution:monitorOriginal&&urlNormal?`${monitorOriginal}\nแก้ไขโดย : ${urlNormal}`:monitorOriginal,
      urlNormal,
      urlAbnormal,
      ticketAction:'กดตั๊กเพิ่มไม่ได้',
      mailCompletion:'ดำเนินการส่ง Mail แจ้งผู้ดูแลระบบเรียบร้อยแล้ว',
    };
  }

  function buildMailDraft(incident,selectedRecord){
    void selectedRecord;
    const sections=['เรียน ผู้ดูแลระบบ'];
    const monitorOriginal=String(incident?.monitorRaw||'').trim()||(incident?.monitor?`Monitor ${String(incident.monitor).trim()}`:'');
    const incidentRaw=String(incident?.incidentRaw||'').trim();
    if(monitorOriginal)sections.push(monitorOriginal);
    if(incidentRaw)sections.push(incidentRaw);
    sections.push('ติดต่อเจ้าหน้าที่ RDNOC\nเบอร์ 02-272-8891 - 3\nLine ID: @RDNOC\nขอบคุณครับ/ขอบคุณค่ะ');
    return sections.join('\n\n');
  }

  return {
    parseIncident,
    normalizeSystemName,
    systemNameSimilarity,
    deriveDomain,
    normalizeTorRecords,
    resolveOwners,
    scoreCandidate,
    findCandidates,
    buildOperationalBlocks,
    buildMailDraft,
  };
});
