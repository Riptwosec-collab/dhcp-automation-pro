import { mkdir, readFile, writeFile } from "node:fs/promises";

const IMAGE_BLOB_SHA = "014811218541942bf3259ff3e2e7ce8547820e67";
const IMAGE_API_URL = `https://api.github.com/repos/Riptwosec-collab/dhcp-automation-pro/git/blobs/${IMAGE_BLOB_SHA}`;

async function writeBackgroundAsset(directory) {
  const response = await fetch(IMAGE_API_URL, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "dhcp-automation-pro-build" }
  });
  if (!response.ok) throw new Error(`Unable to fetch gold background asset: ${response.status}`);
  const payload = await response.json();
  if (!payload.content) throw new Error("Gold background blob has no content");
  const binary = Buffer.from(payload.content.replace(/\s/g, ""), "base64");
  await mkdir(`${directory}/assets`, { recursive: true });
  await writeFile(`${directory}/assets/gold-command-center.webp`, binary);
}

const styles = `
    /* Interactive black-gold 3D command-center background. */
    .gold-3d-stage{
      position:fixed;
      inset:-5vh -5vw;
      z-index:0;
      overflow:hidden;
      pointer-events:none;
      perspective:1200px;
      background:#020202;
    }
    .gold-3d-layer{
      position:absolute;
      inset:-4%;
      will-change:transform;
      transform-style:preserve-3d;
      transition:transform .16s ease-out;
    }
    .gold-3d-image{
      background-image:url('/assets/gold-command-center.webp');
      background-position:center center;
      background-size:cover;
      filter:saturate(1.08) contrast(1.12) brightness(.78);
      transform:translate3d(calc(var(--gold-x,0) * -10px),calc(var(--gold-y,0) * -7px),-70px) scale(1.13);
    }
    .gold-3d-depth{
      background:
        radial-gradient(circle at calc(50% + var(--gold-x,0) * 8%),calc(38% + var(--gold-y,0) * 6%),rgba(255,194,72,.18),transparent 24%),
        linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.52));
      transform:translate3d(calc(var(--gold-x,0) * 15px),calc(var(--gold-y,0) * 10px),15px) scale(1.04);
      mix-blend-mode:screen;
      opacity:.75;
    }
    .gold-3d-grid{
      background-image:
        linear-gradient(rgba(255,190,64,.035) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,190,64,.035) 1px,transparent 1px);
      background-size:72px 72px;
      transform:translate3d(calc(var(--gold-x,0) * 22px),calc(var(--gold-y,0) * 15px),38px) rotateX(1.5deg) scale(1.08);
      mask-image:linear-gradient(to bottom,rgba(0,0,0,.78),transparent 86%);
      opacity:.6;
    }
    .gold-3d-particles{
      background-image:
        radial-gradient(circle,rgba(255,216,126,.75) 0 1px,transparent 1.7px),
        radial-gradient(circle,rgba(255,169,41,.35) 0 1px,transparent 1.8px);
      background-size:83px 79px,137px 123px;
      background-position:13px 17px,41px 66px;
      transform:translate3d(calc(var(--gold-x,0) * 32px),calc(var(--gold-y,0) * 22px),68px) scale(1.08);
      opacity:.28;
      animation:goldParticleDrift 20s linear infinite;
    }
    .gold-3d-vignette{
      background:
        radial-gradient(ellipse at center,transparent 18%,rgba(0,0,0,.13) 52%,rgba(0,0,0,.66) 100%),
        linear-gradient(180deg,rgba(0,0,0,.24),transparent 28%,rgba(0,0,0,.36));
      transform:translateZ(90px);
    }
    body[data-theme="space"] .spline-page-bg{display:none!important}
    body[data-theme="space"]:before,
    body[data-theme="space"]:after{opacity:0!important}
    body[data-theme="network"] .gold-3d-stage{display:none}
    body[data-theme="space"] .app-shell{position:relative;z-index:10}
    @keyframes goldParticleDrift{to{background-position:179px 96px,315px 189px}}
    @media(max-width:768px){
      .gold-3d-stage{inset:-3vh -12vw}
      .gold-3d-image{background-position:43% center;transform:translate3d(calc(var(--gold-x,0) * -6px),calc(var(--gold-y,0) * -5px),-70px) scale(1.28)}
      .gold-3d-grid{background-size:48px 48px}
    }
    @media(prefers-reduced-motion:reduce){
      .gold-3d-layer{transition:none!important;animation:none!important;transform:none!important}
      .gold-3d-image{transform:scale(1.1)!important}
    }
`;

const markup = `
  <div id="gold3dStage" class="gold-3d-stage" aria-hidden="true">
    <div class="gold-3d-layer gold-3d-image"></div>
    <div class="gold-3d-layer gold-3d-depth"></div>
    <div class="gold-3d-layer gold-3d-grid"></div>
    <div class="gold-3d-layer gold-3d-particles"></div>
    <div class="gold-3d-layer gold-3d-vignette"></div>
  </div>
`;

const runtime = `
  <script>
    (() => {
      const root = document.documentElement;
      let targetX = 0, targetY = 0, currentX = 0, currentY = 0, raf = 0;
      const render = () => {
        currentX += (targetX - currentX) * .08;
        currentY += (targetY - currentY) * .08;
        root.style.setProperty('--gold-x', currentX.toFixed(4));
        root.style.setProperty('--gold-y', currentY.toFixed(4));
        if (Math.abs(targetX-currentX) > .001 || Math.abs(targetY-currentY) > .001) raf = requestAnimationFrame(render);
        else raf = 0;
      };
      const setTarget = (x,y) => {
        targetX = Math.max(-1,Math.min(1,x));
        targetY = Math.max(-1,Math.min(1,y));
        if (!raf) raf = requestAnimationFrame(render);
      };
      addEventListener('pointermove',event => setTarget((event.clientX/innerWidth-.5)*2,(event.clientY/innerHeight-.5)*2),{passive:true});
      addEventListener('pointerleave',() => setTarget(0,0),{passive:true});
      addEventListener('deviceorientation',event => {
        if (event.gamma == null || event.beta == null) return;
        setTarget(event.gamma/30,(event.beta-45)/45);
      },{passive:true});
    })();
  </script>
`;

for (const directory of ["public", "dist"]) {
  await writeBackgroundAsset(directory);
  const path = `${directory}/index.html`;
  let html = await readFile(path, "utf8");
  if (!html.includes("Interactive black-gold 3D command-center background")) html = html.replace("  </style>", `${styles}  </style>`);
  if (!html.includes('id="gold3dStage"')) html = html.replace(/<body([^>]*)>/, `<body$1>${markup}`);
  if (!html.includes("deviceorientation")) html = html.replace("</body>", `${runtime}</body>`);
  const required = ["gold-3d-stage","gold-command-center.webp","--gold-x","deviceorientation"];
  const missing = required.filter(value => !html.includes(value));
  if (missing.length) throw new Error(`Gold 3D background build failed in ${path}: ${missing.join(", ")}`);
  await writeFile(path,html,"utf8");
}

console.log("Interactive black-gold 3D background applied to the Space theme.");
