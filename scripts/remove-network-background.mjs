import { readFile, writeFile } from "node:fs/promises";

const style = `
    /* Keep the shared Spline visible and interactive in the Network theme. */
    .spline-page-bg{
      display:block!important;
      pointer-events:auto!important;
      z-index:1!important;
    }
    .spline-page-bg spline-viewer{pointer-events:auto!important}
    body[data-theme="network"] .spline-page-bg{display:block!important}
    body[data-theme="network"]{background:#010817!important}
    body[data-theme="network"] .spline-page-bg spline-viewer{
      opacity:.62!important;
      transform:scale(1.13)!important;
      filter:hue-rotate(170deg) saturate(1.25) brightness(.40) contrast(1.18)!important;
    }
    body[data-theme="network"]:before{
      opacity:1!important;
      background:
        radial-gradient(circle at 12% 0%,rgba(0,153,255,.15),transparent 30%),
        radial-gradient(circle at 88% 0%,rgba(0,229,255,.08),transparent 26%),
        linear-gradient(180deg,rgba(2,12,32,.68) 0%,rgba(1,8,23,.84) 52%,rgba(1,4,13,.94) 100%)!important;
    }
    body[data-theme="network"]:after{
      content:"";
      position:fixed;
      inset:0;
      z-index:2;
      pointer-events:none;
      background:
        radial-gradient(circle at var(--mx,50%) var(--my,30%),rgba(0,190,255,.11),transparent 26%),
        linear-gradient(rgba(0,174,255,.028) 1px,transparent 1px),
        linear-gradient(90deg,rgba(0,174,255,.028) 1px,transparent 1px);
      background-size:auto,64px 64px,64px 64px;
      -webkit-mask-image:linear-gradient(to bottom,rgba(0,0,0,.86),transparent 86%);
      mask-image:linear-gradient(to bottom,rgba(0,0,0,.86),transparent 86%);
    }
`;

for (const directory of ["public", "dist"]) {
  const path = `${directory}/index.html`;
  let html = await readFile(path, "utf8");
  if (!html.includes("Keep the shared Spline visible and interactive in the Network theme")) {
    html = html.replace("  </style>", `${style}  </style>`);
  }
  if (!html.includes('body[data-theme="network"] .spline-page-bg{display:block!important}')) {
    throw new Error(`Interactive Network background was not applied to ${path}`);
  }
  if (html.includes('body[data-theme="network"] .spline-page-bg{display:none!important}')) {
    throw new Error(`Old hidden Network background rule still exists in ${path}`);
  }
  await writeFile(path, html, "utf8");
}

console.log("Interactive Spline background enabled for the Network theme.");
