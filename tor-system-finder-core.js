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

  return {
    parseIncident,
    normalizeSystemName,
    systemNameSimilarity,
    deriveDomain,
  };
});
