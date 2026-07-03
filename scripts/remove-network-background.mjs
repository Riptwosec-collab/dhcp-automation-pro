import { readFile, writeFile } from "node:fs/promises";

const style = `
    /* Remove the previous Spline background from the Network theme. */
    body[data-theme="network"] .spline-page-bg{display:none!important}
    body[data-theme="network"]{background:#010817!important}
    body[data-theme="network"]:before{
      opacity:1!important;
      background:
        radial-gradient(circle at 12% 0%,rgba(0,153,255,.16),transparent 30%),
        radial-gradient(circle at 88% 0%,rgba(0,229,255,.09),transparent 26%),
        linear-gradient(180deg,#020c20 0%,#010817 52%,#01040d 100%)!important;
    }
    body[data-theme="network"]:after{
      content:"";
      position:fixed;
      inset:0;
      z-index:0;
      pointer-events:none;
      background-image:
        linear-gradient(rgba(0,174,255,.035) 1px,transparent 1px),
        linear-gradient(90deg,rgba(0,174,255,.035) 1px,transparent 1px);
      background-size:64px 64px;
      -webkit-mask-image:linear-gradient(to bottom,rgba(0,0,0,.72),transparent 76%);
      mask-image:linear-gradient(to bottom,rgba(0,0,0,.72),transparent 76%);
    }
`;

for (const directory of ["public", "dist"]) {
  const path = `${directory}/index.html`;
  let html = await readFile(path, "utf8");
  if (!html.includes("Remove the previous Spline background from the Network theme")) {
    html = html.replace("  </style>", `${style}  </style>`);
  }
  if (!html.includes('body[data-theme="network"] .spline-page-bg{display:none!important}')) {
    throw new Error(`Network background removal was not applied to ${path}`);
  }
  await writeFile(path, html, "utf8");
}

console.log("Network background removed; clean control-center background applied.");
