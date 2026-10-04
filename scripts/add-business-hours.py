from pathlib import Path
import re

path = Path('operations-messages.html')
text = path.read_text(encoding='utf-8')

start_marker = '/* business-hours-v1:start */'
end_marker = '/* business-hours-v1:end */'

# Keep this generator idempotent by replacing any previous Business Hours block.
text = re.sub(
    r'\n[ \t]*/\* business-hours-v1:start \*/.*?/\* business-hours-v1:end \*/[ \t]*\n?',
    '\n',
    text,
    flags=re.S,
)

# Remove the visible timestamp row only from the no-contact card.
no_contact_card = re.compile(
    r'(<article class="ops-card"><div class="ops-card-head"><div class="ops-card-title">ไม่สามารถติดต่อเจ้าหน้าที่ได้.*?<p class="ops-desc">.*?</p>)'
    r'(?:<div class="ops-stamp">.*?</div>)?'
    r'(</article>)',
    flags=re.S,
)
text, card_count = no_contact_card.subn(r'\1\2', text, count=1)
if card_count != 1:
    raise SystemExit('no-contact Operations card not found')

business_logic = r'''
    /* business-hours-v1:start */
    function getNoContactFollowUp(date=new Date()){
      const next=new Date(date.getTime());
      const day=next.getDay();
      const minutes=next.getHours()*60+next.getMinutes();
      const openMinutes=8*60+30;
      const closeMinutes=18*60;
      if(day===0){next.setDate(next.getDate()+1);next.setHours(8,30,0,0);return next}
      if(day===6){next.setDate(next.getDate()+2);next.setHours(8,30,0,0);return next}
      if(minutes<openMinutes){next.setHours(8,30,0,0);return next}
      if(minutes>=closeMinutes){next.setDate(next.getDate()+(day===5?3:1));next.setHours(8,30,0,0);return next}
      return next
    }
    function formatNoContactFollowUp(date){const pad=n=>String(n).padStart(2,'0'),days=['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์'];return days[date.getDay()]+' '+pad(date.getDate())+'/'+pad(date.getMonth()+1)+'/'+String(date.getFullYear()+543)+' เวลา '+pad(date.getHours())+'.'+pad(date.getMinutes())+' น.'}
    function noContactMessage(date=new Date()){const next=getNoContactFollowUp(date),deferred=next.getTime()!==date.getTime(),when=formatNoContactFollowUp(next);return deferred?'ไม่สามารถติดต่อเจ้าหน้าที่ประจำสำนักงานได้ เนื่องจากเป็นเวลานอกทำการ รอตรวจสอบอีกครั้งในเวลาทำการ '+when:'ไม่สามารถติดต่อเจ้าหน้าที่ประจำสำนักงานได้ รอตรวจสอบอีกครั้ง '+when}
    /* business-hours-v1:end */
'''.rstrip()

# The Operations consistency layer owns operationParts/operationText after it has
# been generated. Keep Business Hours immediately before that layer when present;
# otherwise fall back to the legacy operationText anchor. Canonicalize the
# whitespace at the boundary so repeated generation cannot add blank lines.
unified_anchor = '/* unified-operations-consistency-v1:start */'
legacy_anchor = '    function operationText(key,date=new Date())' if '    function operationText(key,date=new Date())' in text else '    function operationText(key)'
if unified_anchor in text:
    prefix, suffix = text.split(unified_anchor, 1)
    text = prefix.rstrip() + '\n\n' + business_logic + '\n' + unified_anchor + suffix
elif legacy_anchor in text:
    prefix, suffix = text.split(legacy_anchor, 1)
    text = prefix.rstrip() + '\n\n' + business_logic + '\n' + legacy_anchor + suffix
else:
    raise SystemExit('operationText/unified Operations anchor not found')

# Make the legacy operationText deterministic/testable when that runtime shape is
# still present. The unified runtime already carries date through operationParts.
text = text.replace('function operationText(key){const now=formatOperationsNow(),', 'function operationText(key,date=new Date()){const now=formatOperationsNow(date),', 1)

legacy_mapping = "'no-contact':'ไม่สามารถติดต่อเจ้าหน้าที่ประจำสำนักงานได้ เนื่องจากเป็นเวลานอกทำการ รอตรวจสอบอีกครั้งในเวลาทำการ '+stamp,"
legacy_upgraded_mapping = "'no-contact':noContactMessage(date),"
unified_mapping = "'no-contact':{body:noContactMessage(date),stamp:''},"
if legacy_mapping in text:
    text = text.replace(legacy_mapping, legacy_upgraded_mapping, 1)
elif legacy_upgraded_mapping in text or unified_mapping in text:
    # Already routed through Business Hours by a previous generation layer.
    pass
else:
    raise SystemExit('no-contact message mapping was not upgraded')

path.write_text(text, encoding='utf-8')
print('Business Hours v1 applied to Operations Messages')