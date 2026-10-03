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
    const normalized=normalizeUrlEscapes(raw).replace(/\r\n?/g,'\n');
    const lines=normalized.split('\n').map(line=>line.trim()).filter(Boolean);

    const monitorLine=lines.find(line=>/^monitor\b/i.test(line))||'';
    const monitor=monitorLine.replace(/^monitor\s*[:\-]?\s*/i,'').replace(/\s+/g,' ').trim();

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

  return {
    parseIncident,
    normalizeSystemName,
    systemNameSimilarity,
    deriveDomain,
    scoreCandidate,
    findCandidates,
  };
});
