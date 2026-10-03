from pathlib import Path
import re

path = Path('operations-messages.html')
text = path.read_text(encoding='utf-8')

# Remove our previous runtime block before recreating it. Other generators own
# Business Hours and the visual layer; this layer owns only message parity.
text = re.sub(
    r'\n[ \t]*/\* unified-operations-consistency-v1:start \*/.*?/\* unified-operations-consistency-v1:end \*/[ \t]*\n?',
    '\n',
    text,
    count=1,
    flags=re.S,
)

# Remove the legacy separate message/copy implementation if present.
text = re.sub(
    r'\n\s*function operationText\(key(?:,date=new Date\(\))?\)\{.*?\n\s*async function copyOperationMessage\(key,button\)\{.*?\}\n(?=\s*function applyMissionTheme)',
    '\n',
    text,
    count=1,
    flags=re.S,
)

# Attach the operation key to the card itself. This lets COPY read exactly what
# the operator sees instead of maintaining a second hidden text source.
def add_key(match):
    attrs = match.group(1) or ''
    key = match.group(2)
    attrs = re.sub(r'\s+data-operation-key="[^"]*"', '', attrs)
    return f'<article class="ops-card"{attrs} data-operation-key="{key}">'

card_start = re.compile(
    r'<article class="ops-card"([^>]*)>(?=(?:(?!</article>)[\s\S])*?onclick="copyOperationMessage\(\'([^\']+)\',this\)")'
)
text, key_count = card_start.subn(add_key, text)
if key_count != 9:
    raise SystemExit(f'expected 9 Operations cards, found {key_count}')

# Preserve the visual timestamp row for timestamped cards but make it one full,
# human-readable string. The two 10-minute cards and no-contact intentionally
# have no separate timestamp row.
def normalize_card(match):
    card = match.group(0)
    key_match = re.search(r'data-operation-key="([^"]+)"', card)
    if not key_match:
        return card
    key = key_match.group(1)
    card = re.sub(r'<div class="ops-stamp">.*?</div>', '<div class="ops-stamp"></div>', card, flags=re.S)
    if key in {'shutdown-10', 'ten-complete', 'no-contact'}:
        card = re.sub(r'<div class="ops-stamp">.*?</div>', '', card, flags=re.S)
    return card

text = re.sub(r'<article class="ops-card"[^>]*data-operation-key="[^"]+"[^>]*>.*?</article>', normalize_card, text, flags=re.S)

static_bodies = {
    'device-hang': 'ตรวจสอบ Switch และ Router พบ log reboot อุปกรณ์ ปัจจุบันอุปกรณ์กลับมาใช้งานได้ปกติ',
    'link-up': 'ขอแจ้งครับ Link up กลับมา',
    'shutdown-10': 'รับทราบปิดระบบ 10 นาที (ตู้ Rack / เครื่องสำรองไฟ) และรอแจ้งเปิดระบบอีกครั้ง',
    'ten-complete': 'ครบ 10 นาที สามารถเปิดอุปกรณ์ขึ้นมาแล้วแจ้งกลับได้เลย',
    'link-normal-check': 'ตรวจสอบพบวงจรกลับมาปกติก่อนดำเนินการแก้ไข',
    'link-normal-fix': 'แก้ไขโดย : วงจรกลับมาปกติก่อนดำเนินการแก้ไข',
    'power-check': 'ตรวจสอบ Switch และ Router พบ log reboot อุปกรณ์ คาดว่าไฟฟ้าดับ ปัจจุบันอุปกรณ์กลับมาใช้งานได้ปกติ',
    'power-fix': 'แก้ไขโดย : การไฟฟ้าจ่ายกระแสไฟกลับมาใช้งานได้ปกติ',
}

for key, body in static_bodies.items():
    pattern = re.compile(
        rf'(<article class="ops-card"[^>]*data-operation-key="{re.escape(key)}"[^>]*>.*?<p class="ops-desc">).*?(</p>)',
        flags=re.S,
    )
    text, count = pattern.subn(lambda m, b=body: m.group(1) + b + m.group(2), text, count=1)
    if count != 1:
        raise SystemExit(f'Operations description not found for {key}')

runtime = r'''
    /* unified-operations-consistency-v1:start */
    function operationParts(key,date=new Date()){
      const now=formatOperationsNow(date),stamp='วันที่ '+now.date+' เวลา '+now.time+' น.';
      const messages={
        'device-hang':{body:'ตรวจสอบ Switch และ Router พบ log reboot อุปกรณ์ ปัจจุบันอุปกรณ์กลับมาใช้งานได้ปกติ',stamp},
        'no-contact':{body:noContactMessage(date),stamp:''},
        'link-up':{body:'ขอแจ้งครับ Link up กลับมา',stamp},
        'shutdown-10':{body:'รับทราบปิดระบบ 10 นาที (ตู้ Rack / เครื่องสำรองไฟ) และรอแจ้งเปิดระบบอีกครั้ง',stamp:''},
        'ten-complete':{body:'ครบ 10 นาที สามารถเปิดอุปกรณ์ขึ้นมาแล้วแจ้งกลับได้เลย',stamp:''},
        'link-normal-check':{body:'ตรวจสอบพบวงจรกลับมาปกติก่อนดำเนินการแก้ไข',stamp},
        'link-normal-fix':{body:'แก้ไขโดย : วงจรกลับมาปกติก่อนดำเนินการแก้ไข',stamp},
        'power-check':{body:'ตรวจสอบ Switch และ Router พบ log reboot อุปกรณ์ คาดว่าไฟฟ้าดับ ปัจจุบันอุปกรณ์กลับมาใช้งานได้ปกติ',stamp},
        'power-fix':{body:'แก้ไขโดย : การไฟฟ้าจ่ายกระแสไฟกลับมาใช้งานได้ปกติ',stamp}
      };
      return messages[key]||{body:'',stamp:''}
    }
    function operationText(key,date=new Date()){const message=operationParts(key,date);return [message.body,message.stamp].filter(Boolean).join(' ')}
    function renderOperationMessages(date=new Date()){
      document.querySelectorAll('[data-operation-key]').forEach(card=>{
        const message=operationParts(card.dataset.operationKey,date),desc=card.querySelector('.ops-desc'),stamp=card.querySelector('.ops-stamp');
        if(desc)desc.textContent=message.body;
        if(stamp)stamp.textContent=message.stamp;
      })
    }
    async function copyOperationMessage(key,button){
      const card=button?.closest?.('[data-operation-key]'),desc=card?.querySelector('.ops-desc')?.textContent?.trim()||'',stamp=card?.querySelector('.ops-stamp')?.textContent?.trim()||'';
      const text=[desc,stamp].filter(Boolean).join(' ')||operationText(key);
      if(!text)return;
      try{await navigator.clipboard.writeText(text)}catch{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}
      if(button){const old=button.textContent;button.textContent='COPIED';button.disabled=true;setTimeout(()=>{button.textContent=old;button.disabled=false},900)}
    }
    /* unified-operations-consistency-v1:end */
'''.rstrip()

anchor = '    function applyMissionTheme(theme)'
if anchor not in text:
    raise SystemExit('Operations theme function anchor not found')
text = text.replace(anchor, runtime + '\n' + anchor, 1)

canonical_init = "    renderOperationsNow();renderOperationMessages();setInterval(()=>{renderOperationsNow();renderOperationMessages()},1000);"
if canonical_init not in text:
    old_init = '    renderOperationsNow();setInterval(renderOperationsNow,1000);'
    if old_init not in text:
        raise SystemExit('Operations runtime initialization anchor not found')
    text = text.replace(old_init, canonical_init, 1)

path.write_text(text, encoding='utf-8')
print('Unified Finder + Operations Consistency v1 applied to Operations Messages')
