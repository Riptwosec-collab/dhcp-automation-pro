from pathlib import Path
import re


def replace_style_block(text: str, css: str) -> str:
    text = re.sub(
        r'\n\s*/\* responsive-fit-v1 \*/.*?/\* /responsive-fit-v1 \*/\s*',
        '\n',
        text,
        flags=re.S,
    )
    if '</style>' not in text:
        raise SystemExit('style closing tag not found')
    return text.replace('</style>', css + '\n  </style>', 1)


main_path = Path('index.html')
main = main_path.read_text(encoding='utf-8')

# Remove the old mobile-only fixed canvas. Responsive Fit sizes Utility workspaces from the viewport.
main = main.replace(
    '@media(max-width:767px){#view-system-owner,#view-voip,#view-operations{min-height:820px}.utility-workspace-shell{height:820px;min-height:820px}.utility-workspace-title span{display:none}}',
    '@media(max-width:767px){.utility-workspace-title span{display:none}}',
)

main_css = r'''
    /* responsive-fit-v1 */
    html{width:100%;min-width:0;min-height:100%;height:100%}
    body{width:100%;min-width:0;min-height:100svh;height:100dvh;overflow-x:hidden}
    .app-root{width:100%;min-width:0;height:100dvh;min-height:100svh}
    .main-workspace{width:100%;min-width:0;min-height:0}
    .topbar{flex-wrap:wrap;gap:clamp(6px,1vw,16px);min-height:clamp(58px,7.5vh,72px);padding-left:max(clamp(10px,1.5vw,24px),env(safe-area-inset-left));padding-right:max(clamp(10px,1.5vw,24px),env(safe-area-inset-right))}
    .topbar nav{flex:1 1 620px;min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;overscroll-behavior-x:contain}
    .tab-btn{min-height:clamp(42px,6vh,62px);padding-left:clamp(10px,1vw,16px)!important;padding-right:clamp(10px,1vw,16px)!important}
    .brand-block{flex:0 0 auto;min-width:0}.brand-copy{min-width:0}.theme-toggle{flex:0 0 auto;max-width:100%}
    .content-main{width:100%;min-width:0;min-height:0;padding:clamp(10px,1.6vw,24px)!important;overscroll-behavior:contain}
    .workspace-shell{width:100%;max-width:min(100%,1920px);min-width:0;min-height:0;height:100%;gap:clamp(12px,1.4vw,24px)}
    .view-panel,.dhcp-grid,.log-results-layout,.log-result-stack{min-width:0}
    .glass-panel,.terminal-container,.log-card{max-width:100%}
    input,select,textarea,button{max-width:100%}
    img,svg,canvas,video{max-width:100%;height:auto}
    .utility-workspace-shell{width:100%;height:100%;min-height:clamp(420px,calc(100dvh - 150px),1100px);max-height:100%;min-width:0}
    .utility-workspace-frame{width:100%;height:100%;min-width:0;min-height:0;max-width:100%;flex:1 1 auto}
    .utility-workspace-head{gap:clamp(8px,1vw,12px);padding:clamp(8px,1vw,12px)}
    .utility-workspace-title{min-width:0}.utility-workspace-title>div{min-width:0}.utility-workspace-title strong,.utility-workspace-title span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    @media(max-width:1180px){.brand-block{display:none}.topbar nav{flex-basis:520px}.workspace-shell{max-width:100%}}
    @media(max-width:900px){.topbar{align-items:center}.topbar nav{order:1;flex:1 1 100%;width:100%;min-height:46px}.utility-tools-dock{order:2}.theme-toggle{order:3;margin-left:auto}.content-main{padding:clamp(9px,2vw,16px)!important}.dhcp-fields-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.log-results-layout{grid-template-columns:1fr!important}}
    @media(max-width:767px){body{height:auto;min-height:100dvh;overflow-y:auto}.app-root{height:auto;min-height:100dvh;overflow:visible}.topbar{position:sticky;top:0;z-index:80;min-height:0;padding-top:max(8px,env(safe-area-inset-top));padding-bottom:8px}.topbar nav{gap:2px}.tab-btn{min-height:44px;font-size:12px}.theme-choice{padding:7px 8px;font-size:11px}.content-main{overflow:visible!important;padding:clamp(8px,3vw,14px)!important;padding-bottom:max(clamp(10px,3vw,18px),env(safe-area-inset-bottom))!important}.workspace-shell{height:auto;min-height:0}.view-panel{height:auto!important;min-height:0}.dhcp-fields-grid{grid-template-columns:1fr!important}.dhcp-grid{grid-template-columns:1fr!important}.utility-workspace-shell{height:calc(100dvh - 132px);min-height:clamp(460px,calc(100svh - 132px),760px);max-height:none}.utility-workspace-frame{height:100%;min-height:0}.utility-workspace-title span{display:none}.utility-workspace-back{padding:7px 9px}.utility-tools-menu{max-height:min(70dvh,420px);overflow-y:auto}}
    @media(max-width:430px){.topbar{gap:6px;padding-left:max(8px,env(safe-area-inset-left));padding-right:max(8px,env(safe-area-inset-right))}.tab-btn{padding-left:9px!important;padding-right:9px!important;font-size:11px}.theme-toggle{gap:3px;padding:4px}.theme-choice{padding:6px 7px;font-size:10px}.utility-tools-toggle{width:36px;height:36px}.content-main{padding-left:8px!important;padding-right:8px!important}.glass-panel{border-radius:12px!important}}
    @media(max-height:760px) and (min-width:768px){.topbar{min-height:52px;gap:6px}.tab-btn{min-height:48px;padding-top:4px;padding-bottom:4px}.brand-block{display:none}.theme-toggle{padding:4px}.theme-choice{padding:6px 8px}.content-main{padding:8px 12px!important}.workspace-shell{gap:10px}.utility-workspace-head{padding:7px 10px}.utility-workspace-shell{min-height:calc(100dvh - 86px)}.log-card{margin-top:0!important;padding:clamp(14px,2.2vh,22px)!important}}
    @media(min-width:1920px){.workspace-shell{max-width:1920px}.content-main{padding-left:clamp(20px,3vw,48px)!important;padding-right:clamp(20px,3vw,48px)!important}.dhcp-fields-grid{column-gap:clamp(16px,1.2vw,28px)}}
    /* /responsive-fit-v1 */
'''.rstrip()
main = replace_style_block(main, main_css)
main_path.write_text(main, encoding='utf-8')

ops_path = Path('operations-messages.html')
ops = ops_path.read_text(encoding='utf-8')
ops_css = r'''
    /* responsive-fit-v1 */
    html,body{width:100%;max-width:100%;min-width:0;overflow-x:hidden}
    body{padding:clamp(8px,1.2vw,18px)}
    .ops-shell{width:100%;max-width:1640px;min-width:0}
    .ops-topline{gap:clamp(8px,1vw,14px)}
    .ops-title-wrap{min-width:0}.ops-title-wrap h1{font-size:clamp(15px,1.2vw,18px)}
    .ops-group-head{padding:clamp(10px,1vw,16px)}
    .ops-grid,.ops-group.alerts .ops-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:clamp(8px,1vw,12px);padding:clamp(10px,1vw,14px)}
    .ops-card{min-width:0;padding:clamp(11px,1vw,14px)}
    .ops-card-head{min-width:0}.ops-card-title{min-width:0;overflow-wrap:anywhere}.ops-desc{overflow-wrap:anywhere}
    .ops-copy{max-width:48%;white-space:normal;line-height:1.25}
    @media(max-width:767px){.ops-topline{align-items:flex-start;flex-direction:column}.ops-live{max-width:100%;flex-wrap:wrap}.ops-group{border-radius:14px}.ops-group-head{align-items:flex-start}.ops-count{flex:0 0 auto}.ops-copy{max-width:44%}}
    @media(max-width:430px){body{padding:8px}.ops-group-head{padding:10px}.ops-grid,.ops-group.alerts .ops-grid{padding:8px}.ops-card-head{gap:7px}.ops-card-title{font-size:11px}.ops-copy{min-height:28px;padding:0 8px;font-size:8px}}
    @media(max-height:760px) and (min-width:768px){body{padding:8px 12px}.ops-group{margin-top:9px}.ops-group-head{padding:9px 12px}.ops-grid,.ops-group.alerts .ops-grid{gap:8px;padding:9px}.ops-card{padding:10px}.ops-desc{margin:5px 0 7px}}
    /* /responsive-fit-v1 */
'''.rstrip()
ops = replace_style_block(ops, ops_css)
ops_path.write_text(ops, encoding='utf-8')

voip_path = Path('voip-finder.html')
voip = voip_path.read_text(encoding='utf-8')
if 'responsive-fit-v1' not in voip:
    voip = voip.replace(
        '<style id="missionVoipTheme">\n      html,body{min-height:100%!important;height:auto!important;overflow-y:auto!important}',
        '<style id="missionVoipTheme">\n      /* responsive-fit-v1 */\n      html,body{min-height:100%!important;height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;max-width:100%!important}\n      body{width:100%!important;max-width:100%!important}\n      *,*::before,*::after{box-sizing:border-box}\n      img,svg,canvas,video,table{max-width:100%!important}\n      input,select,textarea,button{max-width:100%!important}\n      pre{max-width:100%;overflow:auto}\n      @media(max-width:767px){body{padding-left:max(8px,env(safe-area-inset-left));padding-right:max(8px,env(safe-area-inset-right))}}',
        1,
    )
voip_path.write_text(voip, encoding='utf-8')

owner_path = Path('system-owner-finder.html')
owner = owner_path.read_text(encoding='utf-8')
if 'responsive-fit-v1' not in owner:
    owner = owner.replace(
        '<style id="ownerQuickCopyStyle">',
        '<style id="ownerQuickCopyStyle">\n      /* responsive-fit-v1 */\n      html,body{width:100%;max-width:100%;overflow-x:hidden}\n      body{max-width:100%}\n      *,*::before,*::after{box-sizing:border-box}\n      img,svg,canvas,video,table{max-width:100%}\n      input,select,textarea,button{max-width:100%}\n      pre{max-width:100%;overflow:auto}\n      @media(max-width:767px){body{padding-left:max(8px,env(safe-area-inset-left));padding-right:max(8px,env(safe-area-inset-right))}}',
        1,
    )
    owner = owner.replace(
        '.owner-split-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}',
        '.owner-split-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:8px}',
        1,
    )
owner_path.write_text(owner, encoding='utf-8')

print('Responsive Fit v1 applied to main, Operations, VOIP, and System Owner pages')
