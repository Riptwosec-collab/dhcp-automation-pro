import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const source = await readFile("index.html", "utf8");

const splineScript = '  <script type="module" src="https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js"></script>\n';
const splineStyles = `
    /* Spline is the shared full-page background for both themes. */
    .spline-page-bg{
      position:fixed;
      inset:0;
      z-index:1;
      overflow:hidden;
      pointer-events:none;
      background:#020617;
    }
    .spline-page-bg spline-viewer{
      display:block;
      width:100%;
      height:100%;
      min-width:100vw;
      min-height:100vh;
      transform:scale(1.08);
      transform-origin:center;
      filter:saturate(.9) brightness(.7) contrast(1.04);
    }
    .spline-page-shade{
      position:absolute;
      inset:0;
      pointer-events:none;
      background:
        linear-gradient(180deg,rgba(2,6,23,.34),rgba(2,6,23,.64)),
        radial-gradient(circle at 20% 14%,rgba(56,189,248,.18),transparent 34%),
        radial-gradient(circle at 82% 18%,rgba(139,92,246,.14),transparent 32%);
      transition:background .45s ease;
    }
    body[data-theme="network"] .spline-page-shade{
      background:
        linear-gradient(180deg,rgba(2,6,23,.34),rgba(2,18,31,.66)),
        radial-gradient(circle at 18% 16%,rgba(45,212,191,.20),transparent 34%),
        radial-gradient(circle at 84% 16%,rgba(14,165,233,.18),transparent 34%);
    }
    .space-bg{display:none!important}
    .app-shell{position:relative;z-index:10}
    body:before{opacity:.22}
    @media(max-width:768px){
      .spline-page-bg spline-viewer{transform:scale(1.32)}
      .spline-page-shade{background:linear-gradient(180deg,rgba(2,6,23,.42),rgba(2,6,23,.76))}
    }
`;
const splineMarkup = `  <div class="spline-page-bg" aria-hidden="true">
    <spline-viewer url="https://prod.spline.design/JjxXgOnkzKI104Ve/scene.splinecode"></spline-viewer>
    <div class="spline-page-shade"></div>
  </div>\n`;

let html = source;
if (!html.includes("@splinetool/viewer@1.12.98")) {
  html = html.replace(
    '  <script src="https://cdn.tailwindcss.com"></script>\n',
    `  <script src="https://cdn.tailwindcss.com"></script>\n${splineScript}`
  );
}
if (!html.includes(".spline-page-bg{")) {
  html = html.replace("  </style>", `${splineStyles}  </style>`);
}
if (!html.includes('class="spline-page-bg"')) {
  html = html.replace(
    '<body class="text-white min-h-screen p-6" data-theme="space">\n',
    `<body class="text-white min-h-screen p-6" data-theme="space">\n${splineMarkup}`
  );
}

const required = [
  "@splinetool/viewer@1.12.98",
  "JjxXgOnkzKI104Ve/scene.splinecode",
  'class="spline-page-bg"',
  ".space-bg{display:none!important}"
];
const missing = required.filter((value) => !html.includes(value));
if (missing.length) throw new Error(`Build failed, missing: ${missing.join(", ")}`);

for (const directory of ["public", "dist"]) {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, html, "utf8");
}

console.log("Build passed: Spline moved to the full-page background for Space and Network themes.");
