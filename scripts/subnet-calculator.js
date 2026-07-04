(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SubnetCalculator = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const HISTORY_KEY = "dhcpSubnetCalculatorHistory";
  const STATE_KEY = "dhcpSubnetCalculatorState";
  const MAX_SPLIT_ROWS = 1024;

  function fail(message) {
    throw new Error(message);
  }

  function assertIntegerString(value, label) {
    const text = String(value).trim();
    if (!/^\d+$/.test(text)) fail(`${label} ต้องเป็นตัวเลขจำนวนเต็ม`);
    return Number(text);
  }

  function parseIPv4(ip) {
    const text = String(ip || "").trim();
    const parts = text.split(".");
    if (parts.length !== 4) fail("รูปแบบ IPv4 Address ไม่ถูกต้อง");
    return parts.map((part) => {
      const value = assertIntegerString(part, "Octet");
      if (value < 0 || value > 255) fail("Octet แต่ละชุดต้องอยู่ระหว่าง 0-255");
      return value;
    });
  }

  function isValidIPv4(ip) {
    try {
      parseIPv4(ip);
      return true;
    } catch {
      return false;
    }
  }

  function normalizePrefix(prefix) {
    const value = typeof prefix === "number" ? prefix : assertIntegerString(prefix, "CIDR Prefix");
    if (!Number.isInteger(value) || value < 0 || value > 32) fail("CIDR Prefix ต้องอยู่ระหว่าง /0 ถึง /32");
    return value;
  }

  function ipToUint32(ip) {
    const [a, b, c, d] = parseIPv4(ip);
    return (((((a * 256) + b) * 256 + c) * 256 + d) >>> 0);
  }

  function uint32ToIp(number) {
    const value = Number(number) >>> 0;
    return [
      (value >>> 24) & 255,
      (value >>> 16) & 255,
      (value >>> 8) & 255,
      value & 255,
    ].join(".");
  }

  function prefixToMask(prefix) {
    const p = normalizePrefix(prefix);
    const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
    return uint32ToIp(mask);
  }

  function maskToPrefix(mask) {
    const value = ipToUint32(mask);
    const bits = value.toString(2).padStart(32, "0");
    if (!/^1*0*$/.test(bits)) fail("Subnet Mask นี้ไม่ใช่ Mask แบบต่อเนื่อง");
    return bits.indexOf("0") === -1 ? 32 : bits.indexOf("0");
  }

  function getWildcardMask(mask) {
    return uint32ToIp((~ipToUint32(mask)) >>> 0);
  }

  function formatNumber(value) {
    if (typeof value === "bigint") return value.toLocaleString("en-US");
    return Number(value).toLocaleString("en-US");
  }

  function ipClass(firstOctet) {
    if (firstOctet <= 127) return "Class A";
    if (firstOctet <= 191) return "Class B";
    if (firstOctet <= 223) return "Class C";
    if (firstOctet <= 239) return "Class D";
    return "Class E";
  }

  function classifyIp(ip) {
    const [a, b, c, d] = parseIPv4(ip);
    const value = ipToUint32(ip);
    let type = "Public";
    if (value === 0) type = "Unspecified";
    else if (value === 0xffffffff) type = "Broadcast";
    else if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) type = "Private";
    else if (a === 127) type = "Loopback";
    else if (a === 169 && b === 254) type = "Link-local/APIPA";
    else if (a >= 224 && a <= 239) type = "Multicast";
    else if (a >= 240) type = "Reserved";
    return { type, className: ipClass(a), octets: [a, b, c, d] };
  }

  function calculateSubnet(ip, prefix) {
    const p = normalizePrefix(prefix);
    const ipInt = ipToUint32(ip);
    const mask = prefixToMask(p);
    const maskInt = ipToUint32(mask);
    const wildcardInt = (~maskInt) >>> 0;
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | wildcardInt) >>> 0;
    const hostBits = 32 - p;
    const totalBig = 1n << BigInt(hostBits);
    const usableBig = p === 31 ? 2n : p === 32 ? 1n : totalBig > 2n ? totalBig - 2n : 0n;
    const firstInt = p >= 31 ? networkInt : (networkInt + 1) >>> 0;
    const lastInt = p >= 31 ? broadcastInt : (broadcastInt - 1) >>> 0;
    const blockBig = totalBig;
    const nextBig = BigInt(networkInt) + blockBig;
    const previousBig = BigInt(networkInt) - blockBig;
    const classification = classifyIp(ip);
    const routeType = p === 31 ? "Point-to-Point" : p === 32 ? "Host Route" : "Standard Network";

    return {
      ipAddress: uint32ToIp(ipInt),
      prefix: p,
      subnetMask: mask,
      wildcardMask: uint32ToIp(wildcardInt),
      networkAddress: uint32ToIp(networkInt),
      broadcastAddress: uint32ToIp(broadcastInt),
      firstUsableHost: uint32ToIp(firstInt),
      lastUsableHost: uint32ToIp(lastInt),
      totalAddresses: totalBig,
      usableHosts: usableBig,
      totalAddressesText: formatNumber(totalBig),
      usableHostsText: formatNumber(usableBig),
      networkBits: p,
      hostBits,
      ipAddressType: classification.type,
      ipClass: classification.className,
      routeType,
      binarySubnetMask: mask.split(".").map((part) => Number(part).toString(2).padStart(8, "0")).join("."),
      binaryIpAddress: uint32ToIp(ipInt).split(".").map((part) => Number(part).toString(2).padStart(8, "0")).join("."),
      cidrNotation: `${uint32ToIp(networkInt)}/${p}`,
      nextSubnet: nextBig > 0xffffffffn ? "-" : `${uint32ToIp(Number(nextBig))}/${p}`,
      previousSubnet: previousBig < 0n ? "-" : `${uint32ToIp(Number(previousBig))}/${p}`,
      blockSize: formatNumber(blockBig),
      blockSizeRaw: blockBig,
    };
  }

  function calculateRequiredPrefix(hostCount) {
    const hosts = typeof hostCount === "number" ? hostCount : assertIntegerString(hostCount, "Host Requirement");
    if (!Number.isInteger(hosts) || hosts < 1) fail("Host Requirement ต้องเป็นจำนวนเต็มบวก");
    if (hosts === 1) {
      return { requestedHosts: hosts, prefix: 32, subnetMask: prefixToMask(32), totalAddresses: 1n, usableHosts: 1n, reservedAddresses: 0n, remainingCapacity: 0n };
    }
    let hostBits = 1;
    while ((1n << BigInt(hostBits)) - 2n < BigInt(hosts)) hostBits += 1;
    const prefix = 32 - hostBits;
    const total = 1n << BigInt(hostBits);
    const usable = total - 2n;
    return {
      requestedHosts: hosts,
      prefix,
      subnetMask: prefixToMask(prefix),
      totalAddresses: total,
      usableHosts: usable,
      reservedAddresses: total - usable,
      remainingCapacity: usable - BigInt(hosts),
    };
  }

  function splitNetwork(network, currentPrefix, newPrefix) {
    const parentPrefix = normalizePrefix(currentPrefix);
    const targetPrefix = normalizePrefix(newPrefix);
    if (targetPrefix < parentPrefix) fail("Prefix ใหม่ต้องมากกว่าหรือเท่ากับ Parent Prefix");
    const parent = calculateSubnet(network, parentPrefix);
    const countBig = 1n << BigInt(targetPrefix - parentPrefix);
    if (countBig > BigInt(MAX_SPLIT_ROWS)) fail("จำนวน Subnet มากเกินกว่าที่ระบบจะแสดงได้");
    const step = 1n << BigInt(32 - targetPrefix);
    const start = BigInt(ipToUint32(parent.networkAddress));
    const rows = [];
    for (let index = 0n; index < countBig; index += 1n) {
      const subnet = calculateSubnet(uint32ToIp(Number(start + (index * step))), targetPrefix);
      rows.push({ index: Number(index) + 1, ...subnet });
    }
    return rows;
  }

  function parseCidrInput(text, fallbackPrefix) {
    const raw = String(text || "").trim();
    const [ip, suffix] = raw.split("/");
    const prefix = suffix === undefined || suffix === "" ? fallbackPrefix : normalizePrefix(suffix);
    return { ip: ip.trim(), prefix: normalizePrefix(prefix) };
  }

  function copyToClipboard(text) {
    const value = String(text);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
    if (typeof document !== "undefined") {
      const area = document.createElement("textarea");
      area.value = value;
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    return Promise.resolve();
  }

  function showToast(message, type = "success") {
    if (typeof document === "undefined") return;
    const old = document.querySelector(".subnet-toast");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.className = `subnet-toast subnet-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  }

  function resultPairs(result) {
    return [
      ["IP Address", result.ipAddress],
      ["CIDR Prefix", `/${result.prefix}`],
      ["Subnet Mask", result.subnetMask],
      ["Wildcard Mask", result.wildcardMask],
      ["Network Address", result.networkAddress],
      ["Broadcast Address", result.broadcastAddress],
      ["First Usable Host", result.firstUsableHost],
      ["Last Usable Host", result.lastUsableHost],
      ["Total IP Addresses", result.totalAddressesText],
      ["Usable Host Addresses", result.usableHostsText],
      ["Network Bits", result.networkBits],
      ["Host Bits", result.hostBits],
      ["IP Address Type", result.ipAddressType],
      ["IP Class", result.ipClass],
      ["Binary Subnet Mask", result.binarySubnetMask],
      ["Binary IP Address", result.binaryIpAddress],
      ["Network/CIDR Notation", result.cidrNotation],
      ["Next Subnet", result.nextSubnet],
      ["Previous Subnet", result.previousSubnet],
      ["Block Size", result.blockSize],
    ];
  }

  function initSubnetCalculator() {
    if (typeof document === "undefined" || document.documentElement.dataset.subnetCalculatorReady) return;
    document.documentElement.dataset.subnetCalculatorReady = "true";

    const app = document.querySelector(".app-shell, .final-v5-shell");
    if (!app) return;

    let dhcpPage = document.getElementById("dhcpPage");
    if (!dhcpPage) {
      dhcpPage = document.createElement("section");
      dhcpPage.id = "dhcpPage";
      app.parentNode.insertBefore(dhcpPage, app);
      dhcpPage.appendChild(app);
    }

    let nav = document.getElementById("mainAppNav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "mainAppNav";
      nav.className = "app-page-nav";
      nav.setAttribute("aria-label", "Main application navigation");
      nav.innerHTML = `
        <a href="#dhcp" data-page-link="dhcp" class="app-page-nav-link"><i class="fas fa-server"></i><span>DHCP Generator</span></a>
        <a href="#subnet" data-page-link="subnet" class="app-page-nav-link"><i class="fas fa-calculator"></i><span>Subnet Calculator</span></a>
      `;
      dhcpPage.parentNode.insertBefore(nav, dhcpPage);
    }

    let subnetPage = document.getElementById("subnetPage");
    if (!subnetPage) {
      subnetPage = document.createElement("section");
      subnetPage.id = "subnetPage";
      subnetPage.className = "hidden subnet-page";
      dhcpPage.after(subnetPage);
    }
    subnetPage.innerHTML = buildSubnetMarkup();
    wireSubnetUi(subnetPage);

    const route = () => {
      const page = location.hash === "#subnet" ? "subnet" : "dhcp";
      dhcpPage.classList.toggle("hidden", page !== "dhcp");
      subnetPage.classList.toggle("hidden", page !== "subnet");
      document.querySelectorAll("[data-page-link]").forEach((link) => link.classList.toggle("active", link.dataset.pageLink === page));
      document.body.classList.toggle("subnet-page-open", page === "subnet");
      if (page === "subnet") calculateFromInputs(subnetPage, false);
    };
    window.addEventListener("hashchange", route);
    if (!location.hash) history.replaceState(null, "", "#dhcp");
    route();
  }

  function buildSubnetMarkup() {
    return `
      <div class="subnet-wrap">
        <header class="subnet-hero glass-panel">
          <div>
            <p class="subnet-kicker"><i class="fas fa-network-wired"></i> Network Engineer Tool</p>
            <h1>IPv4 Subnet Calculator</h1>
            <p>คำนวณ Network Address, Broadcast Address, Host Range และ Subnet Mask ได้อย่างรวดเร็วในเครื่องของคุณ</p>
            <div class="subnet-badges"><span>IPv4</span><span>CIDR</span><span>Network Engineer Tool</span><span>Client-side Calculation</span></div>
            <div class="subnet-guide-menu">
              <button data-action="open-guide"><i class="fas fa-book-open"></i> Guide</button>
              <button data-action="show-explain"><i class="fas fa-circle-info"></i> Explanation</button>
            </div>
          </div>
          <div class="subnet-hero-icon"><i class="fas fa-diagram-project"></i></div>
        </header>

        <div class="subnet-tabs" role="tablist">
          <button class="active" data-subnet-tab="ip"><i class="fas fa-calculator"></i> IP Calculator</button>
          <button data-subnet-tab="host"><i class="fas fa-users"></i> Host Requirement</button>
          <button data-subnet-tab="split"><i class="fas fa-code-branch"></i> Split Network</button>
          <button data-subnet-tab="recent"><i class="fas fa-clock-rotate-left"></i> Recent</button>
        </div>

        <div class="subnet-layout">
          <section class="subnet-card glass-panel subnet-inputs">
            <div data-subnet-panel="ip">
              <h2><i class="fas fa-circle-nodes"></i> IP Calculator</h2>
              <label>IPv4 Address<input id="subnetIpInput" value="192.168.10.25" placeholder="192.168.10.25 หรือ 192.168.10.25/24"></label>
              <div class="subnet-two">
                <label>CIDR Prefix<input id="subnetPrefixInput" type="number" min="0" max="32" value="24"></label>
                <label>Subnet Mask<input id="subnetMaskInput" value="255.255.255.0"></label>
              </div>
              <input id="subnetPrefixSlider" type="range" min="0" max="32" value="24" aria-label="CIDR Prefix Slider">
              <div class="subnet-actions">
                <button data-action="calculate"><i class="fas fa-bolt"></i> Calculate</button>
                <button data-action="example"><i class="fas fa-wand-magic-sparkles"></i> Use Example</button>
                <button data-action="reset"><i class="fas fa-rotate-left"></i> Reset</button>
                <button data-action="copy-all"><i class="fas fa-copy"></i> Copy All Results</button>
              </div>
              <p class="subnet-error" data-error="ip"></p>
            </div>

            <div class="hidden" data-subnet-panel="host">
              <h2><i class="fas fa-users"></i> Host Requirement</h2>
              <label>จำนวน Host ที่ต้องการ<input id="hostRequirementInput" type="number" min="1" value="50"></label>
              <div class="subnet-presets">${[10, 30, 50, 100, 250, 500, 1000].map((n) => `<button data-host-preset="${n}">${n} Hosts</button>`).join("")}</div>
              <div id="hostRequirementResult" class="subnet-mini-result"></div>
            </div>

            <div class="hidden" data-subnet-panel="split">
              <h2><i class="fas fa-code-branch"></i> Split Network</h2>
              <div class="subnet-two">
                <label>Parent Network<input id="splitParentInput" value="192.168.10.0/24"></label>
                <label>New Prefix<input id="splitPrefixInput" type="number" min="0" max="32" value="26"></label>
              </div>
              <label>หรือจำนวน Subnet<input id="splitCountInput" type="number" min="1" placeholder="เช่น 4"></label>
              <div class="subnet-actions">
                <button data-action="split"><i class="fas fa-table-cells"></i> Calculate Split</button>
                <button data-action="copy-split"><i class="fas fa-copy"></i> Copy All</button>
                <button data-action="export-csv"><i class="fas fa-file-csv"></i> Export CSV</button>
              </div>
              <input id="splitSearchInput" class="subnet-search" placeholder="Search table">
              <div id="splitSummary" class="subnet-mini-result"></div>
              <div class="subnet-table-wrap"><table id="splitTable"><thead><tr><th>#</th><th>Network/CIDR</th><th>First Host</th><th>Last Host</th><th>Broadcast</th><th>Usable Hosts</th><th></th></tr></thead><tbody></tbody></table></div>
            </div>

            <div class="hidden" data-subnet-panel="recent">
              <h2><i class="fas fa-clock-rotate-left"></i> Recent Calculations</h2>
              <div id="subnetHistory"></div>
              <button data-action="clear-history"><i class="fas fa-trash"></i> Clear History</button>
            </div>
          </section>

          <section class="subnet-card glass-panel subnet-results">
            <div class="subnet-results-head"><h2><i class="fas fa-gauge-high"></i> Calculation Results</h2><span id="subnetRouteType">Standard Network</span></div>
            <div id="subnetResultGrid" class="subnet-result-grid"></div>
            <div id="subnetViz" class="subnet-viz"></div>
          </section>
        </div>

        <div class="subnet-lower">
          <section class="subnet-card glass-panel subnet-cidr-card">
            <h2><i class="fas fa-book"></i> CIDR Quick Reference</h2>
            <input id="cidrSearch" class="subnet-search" placeholder="Search CIDR or Mask">
            <div class="subnet-table-wrap"><table id="cidrRefTable"><thead><tr><th>CIDR</th><th>Subnet Mask</th><th>Total IPs</th><th>Usable Hosts</th><th></th></tr></thead><tbody></tbody></table></div>
          </section>

          <section class="subnet-card glass-panel">
            <h2><i class="fas fa-terminal"></i> Cisco Configuration Helper</h2>
            <div class="subnet-cisco-form">
              <label>VLAN ID<input id="ciscoVlan" value="10"></label>
              <label>Interface Name<input id="ciscoInterface" value="Vlan10"></label>
              <label>Pool Name<input id="ciscoPool" value="VLAN10_USERS"></label>
              <label>Description<input id="ciscoDescription" value="USERS_NETWORK"></label>
              <label>Gateway Strategy<select id="ciscoGatewayStrategy"><option value="first">First Usable IP</option><option value="last">Last Usable IP</option><option value="custom">Custom</option></select></label>
              <label>Custom Gateway<input id="ciscoCustomGateway" placeholder="192.168.10.1"></label>
              <label>Excluded Start<input id="ciscoExcludedStart" placeholder="192.168.10.1"></label>
              <label>Excluded End<input id="ciscoExcludedEnd" placeholder="192.168.10.20"></label>
            </div>
            <div class="subnet-code-grid">
              <pre id="ciscoInterfaceConfig"></pre>
              <pre id="ciscoDhcpConfig"></pre>
            </div>
            <div class="subnet-actions">
              <button data-action="copy-interface"><i class="fas fa-copy"></i> Copy Interface Config</button>
              <button data-action="copy-dhcp"><i class="fas fa-copy"></i> Copy DHCP Config</button>
              <button data-action="send-dhcp"><i class="fas fa-share"></i> Send to DHCP Generator</button>
            </div>
          </section>
        </div>
        <section id="subnetExplainCard" class="subnet-card glass-panel subnet-explain-card">
          <div>
            <h2><i class="fas fa-lightbulb"></i> IPv4 Subnet Explanation</h2>
            <p>Enter an IP/CIDR such as <b>192.168.10.25/24</b>. The calculator returns Network Address, Broadcast Address, usable Host Range, Wildcard Mask, and Cisco-ready snippets without sending data outside the browser.</p>
          </div>
          <div class="subnet-explain-grid">
            <article><i class="fas fa-flag"></i><strong>Network Address</strong><span>First address of the subnet.</span></article>
            <article><i class="fas fa-tower-broadcast"></i><strong>Broadcast Address</strong><span>Last address of the subnet.</span></article>
            <article><i class="fas fa-users"></i><strong>Host Range</strong><span>Usable client IP range.</span></article>
            <article><i class="fas fa-table-cells"></i><strong>CIDR Reference</strong><span>Click a prefix to apply it.</span></article>
          </div>
        </section>
        <div id="subnetGuideModal" class="subnet-guide-modal" aria-hidden="true">
          <div class="subnet-guide-dialog" role="dialog" aria-modal="true" aria-label="IPv4 Subnet Calculator Guide">
            <div class="subnet-guide-head">
              <h2><i class="fas fa-book-open"></i> IPv4 Subnet Calculator Guide</h2>
              <button data-action="close-guide" aria-label="Close guide"><i class="fas fa-xmark"></i></button>
            </div>
            <div class="subnet-guide-body">
              <img class="subnet-guide-image subnet-guide-network" src="/assets/subnet-guide-network.png?v=1" alt="Network theme IPv4 Subnet Calculator guide">
              <img class="subnet-guide-image subnet-guide-space" src="/assets/subnet-guide-space.png?v=1" alt="Space theme IPv4 Subnet Calculator guide">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function wireSubnetUi(page) {
    let currentResult = null;
    let splitRows = [];
    const $ = (id) => page.querySelector(`#${id}`);
    const state = loadJson(STATE_KEY, {});
    if (state.ip) $("subnetIpInput").value = state.ip;
    if (state.prefix !== undefined) $("subnetPrefixInput").value = state.prefix;
    $("subnetMaskInput").value = prefixToMask($("subnetPrefixInput").value);
    $("subnetPrefixSlider").value = $("subnetPrefixInput").value;

    function setError(message) {
      const error = page.querySelector('[data-error="ip"]');
      error.textContent = message || "";
      page.querySelectorAll(".subnet-inputs input").forEach((input) => input.classList.toggle("is-invalid", Boolean(message) && document.activeElement === input));
    }

    function calculate(save = true) {
      try {
        const parsed = parseCidrInput($("subnetIpInput").value, $("subnetPrefixInput").value);
        $("subnetIpInput").value = parsed.ip;
        $("subnetPrefixInput").value = parsed.prefix;
        $("subnetPrefixSlider").value = parsed.prefix;
        $("subnetMaskInput").value = prefixToMask(parsed.prefix);
        currentResult = calculateSubnet(parsed.ip, parsed.prefix);
        renderResult(page, currentResult);
        renderCisco(page, currentResult);
        if (save) {
          localStorage.setItem(STATE_KEY, JSON.stringify({ ip: parsed.ip, prefix: parsed.prefix }));
          addHistory(currentResult);
          renderHistory(page, calculate);
        }
        setError("");
        return currentResult;
      } catch (error) {
        setError(error.message);
        return null;
      }
    }

    window.calculateFromSubnetInputs = () => calculate(false);
    const debounced = debounce(() => calculate(false), 250);
    page.addEventListener("input", (event) => {
      const target = event.target;
      if (target.id === "subnetPrefixSlider") {
        $("subnetPrefixInput").value = target.value;
        $("subnetMaskInput").value = prefixToMask(target.value);
        debounced();
      } else if (target.id === "subnetPrefixInput") {
        try {
          $("subnetPrefixSlider").value = normalizePrefix(target.value);
          $("subnetMaskInput").value = prefixToMask(target.value);
          debounced();
        } catch {}
      } else if (target.id === "subnetMaskInput") {
        try {
          const prefix = maskToPrefix(target.value);
          $("subnetPrefixInput").value = prefix;
          $("subnetPrefixSlider").value = prefix;
          debounced();
        } catch {}
      } else if (target.closest(".subnet-cisco-form")) {
        if (currentResult) renderCisco(page, currentResult);
      } else if (target.id === "splitSearchInput") {
        renderSplitTable(page, splitRows, target.value);
      } else if (target.id === "cidrSearch") {
        renderCidrReference(page, target.value);
      } else if (["subnetIpInput"].includes(target.id)) {
        debounced();
      }
    });

    page.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.target.closest("[data-subnet-panel='ip']")) {
        event.preventDefault();
        calculate(true);
      }
    });

    page.addEventListener("click", async (event) => {
      const tab = event.target.closest("[data-subnet-tab]");
      if (tab) {
        activateTab(page, tab.dataset.subnetTab);
        return;
      }
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "calculate") calculate(true);
      if (action === "example") {
        $("subnetIpInput").value = "10.10.10.130/26";
        calculate(true);
      }
      if (action === "reset") {
        $("subnetIpInput").value = "192.168.10.25";
        $("subnetPrefixInput").value = "24";
        $("subnetPrefixSlider").value = "24";
        $("subnetMaskInput").value = "255.255.255.0";
        calculate(true);
      }
      if (action === "copy-all" && currentResult) copyText(resultPairs(currentResult).map(([k, v]) => `${k}: ${v}`).join("\n"), "คัดลอกผลลัพธ์ทั้งหมดแล้ว");
      if (action === "split") {
        try {
          const parent = parseCidrInput($("splitParentInput").value, 24);
          let targetPrefix = $("splitPrefixInput").value;
          const countRaw = $("splitCountInput").value.trim();
          if (countRaw) {
            const count = assertIntegerString(countRaw, "จำนวน Subnet");
            const bits = Math.ceil(Math.log2(count));
            targetPrefix = parent.prefix + bits;
          }
          splitRows = splitNetwork(parent.ip, parent.prefix, targetPrefix);
          $("splitSummary").textContent = `จะแสดง ${splitRows.length} Subnets จาก ${parent.ip}/${parent.prefix} เป็น /${targetPrefix}`;
          renderSplitTable(page, splitRows, $("splitSearchInput").value);
        } catch (error) {
          $("splitSummary").textContent = error.message;
        }
      }
      if (action === "copy-split") copyText(splitRows.map(splitRowText).join("\n"), "คัดลอกตาราง Split Network แล้ว");
      if (action === "export-csv") exportSplitCsv(splitRows);
      if (action === "open-guide") {
        const modal = page.querySelector("#subnetGuideModal");
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
      }
      if (action === "close-guide") {
        const modal = page.querySelector("#subnetGuideModal");
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      }
      if (action === "show-explain") page.querySelector("#subnetExplainCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (action === "clear-history") {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory(page, calculate);
      }
      if (action === "copy-interface") copyText($("ciscoInterfaceConfig").textContent, "คัดลอก Interface Config แล้ว");
      if (action === "copy-dhcp") copyText($("ciscoDhcpConfig").textContent, "คัดลอก DHCP Config แล้ว");
      if (action === "send-dhcp" && currentResult) sendToDhcpGenerator(page, currentResult);
      const preset = event.target.closest("[data-host-preset]");
      if (preset) {
        $("hostRequirementInput").value = preset.dataset.hostPreset;
        renderHostRequirement(page);
      }
      const copyValue = event.target.closest("[data-copy-value]");
      if (copyValue) copyText(copyValue.dataset.copyValue, `คัดลอก ${copyValue.dataset.copyLabel || "ข้อมูล"} แล้ว`);
      const cidrApply = event.target.closest("[data-apply-cidr]");
      if (cidrApply) {
        activateTab(page, "ip");
        $("subnetPrefixInput").value = cidrApply.dataset.applyCidr;
        $("subnetPrefixSlider").value = cidrApply.dataset.applyCidr;
        $("subnetMaskInput").value = prefixToMask(cidrApply.dataset.applyCidr);
        calculate(true);
      }
      if (event.target.id === "subnetGuideModal") {
        event.target.classList.remove("is-open");
        event.target.setAttribute("aria-hidden", "true");
      }
    });

    page.querySelector("#hostRequirementInput").addEventListener("input", () => renderHostRequirement(page));
    renderHostRequirement(page);
    renderCidrReference(page);
    renderHistory(page, calculate);
    calculate(false);
  }

  function calculateFromInputs(page, save) {
    if (page && window.calculateFromSubnetInputs) window.calculateFromSubnetInputs(save);
  }

  function activateTab(page, name) {
    page.querySelectorAll("[data-subnet-tab]").forEach((btn) => btn.classList.toggle("active", btn.dataset.subnetTab === name));
    page.querySelectorAll("[data-subnet-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.subnetPanel !== name));
    localStorage.setItem(STATE_KEY, JSON.stringify({ ...loadJson(STATE_KEY, {}), tab: name }));
  }

  function renderResult(page, result) {
    page.querySelector("#subnetRouteType").textContent = result.routeType;
    page.querySelector("#subnetResultGrid").innerHTML = resultPairs(result).map(([label, value]) => `
      <article class="subnet-result-item">
        <span>${label}</span>
        <strong>${value}</strong>
        <button aria-label="Copy ${label}" data-copy-label="${label}" data-copy-value="${String(value).replace(/"/g, "&quot;")}"><i class="fas fa-copy"></i></button>
      </article>
    `).join("");
    page.querySelector("#subnetViz").innerHTML = `
      <div title="Network Address"><span>Network</span><strong>${result.networkAddress}</strong></div>
      <div title="Usable Host Range"><span>Usable Host Range</span><strong>${result.firstUsableHost} - ${result.lastUsableHost}</strong></div>
      <div title="Broadcast Address"><span>Broadcast</span><strong>${result.broadcastAddress}</strong></div>
    `;
  }

  function renderHostRequirement(page) {
    const input = page.querySelector("#hostRequirementInput");
    const output = page.querySelector("#hostRequirementResult");
    try {
      const result = calculateRequiredPrefix(input.value);
      output.innerHTML = `
        <b>Recommended CIDR:</b> /${result.prefix}<br>
        <b>Subnet Mask:</b> ${result.subnetMask}<br>
        <b>Total:</b> ${formatNumber(result.totalAddresses)} |
        <b>Usable:</b> ${formatNumber(result.usableHosts)} |
        <b>Reserved:</b> ${formatNumber(result.reservedAddresses)} |
        <b>Remaining:</b> ${formatNumber(result.remainingCapacity)}
      `;
    } catch (error) {
      output.textContent = error.message;
    }
  }

  function renderSplitTable(page, rows, query = "") {
    const needle = query.trim().toLowerCase();
    const visible = rows.filter((row) => !needle || splitRowText(row).toLowerCase().includes(needle));
    page.querySelector("#splitTable tbody").innerHTML = visible.map((row) => `
      <tr>
        <td>${row.index}</td><td>${row.cidrNotation}</td><td>${row.firstUsableHost}</td><td>${row.lastUsableHost}</td><td>${row.broadcastAddress}</td><td>${row.usableHostsText}</td>
        <td><button data-copy-value="${splitRowText(row)}" data-copy-label="Subnet Row"><i class="fas fa-copy"></i></button></td>
      </tr>
    `).join("");
  }

  function splitRowText(row) {
    return `${row.index}, ${row.cidrNotation}, ${row.firstUsableHost}, ${row.lastUsableHost}, ${row.broadcastAddress}, ${row.usableHostsText}`;
  }

  function renderCidrReference(page, query = "") {
    const table = page.querySelector("#cidrRefTable tbody");
    const needle = query.trim().toLowerCase();
    table.innerHTML = Array.from({ length: 25 }, (_, index) => index + 8)
      .filter((prefix) => !needle || `/${prefix} ${prefixToMask(prefix)}`.toLowerCase().includes(needle))
      .map((prefix) => {
        const sample = calculateSubnet("10.0.0.1", prefix);
        const note = prefix === 31 ? "2 สำหรับ Point-to-Point" : prefix === 32 ? "1 Host Route" : sample.usableHostsText;
        return `<tr title="${prefix >= 31 ? sample.routeType : "Click CIDR to apply"}"><td><button data-apply-cidr="${prefix}">/${prefix}</button></td><td>${sample.subnetMask}</td><td>${sample.totalAddressesText}</td><td>${note}</td><td><button data-copy-value="${sample.subnetMask}" data-copy-label="Mask"><i class="fas fa-copy"></i></button></td></tr>`;
      }).join("");
  }

  function renderCisco(page, result) {
    const value = (id) => page.querySelector(`#${id}`).value.trim();
    const strategy = value("ciscoGatewayStrategy");
    const gateway = strategy === "last" ? result.lastUsableHost : strategy === "custom" && value("ciscoCustomGateway") ? value("ciscoCustomGateway") : result.firstUsableHost;
    const vlan = value("ciscoVlan") || "10";
    const iface = value("ciscoInterface") || `Vlan${vlan}`;
    const pool = value("ciscoPool") || `VLAN${vlan}_POOL`;
    const description = value("ciscoDescription") || "DHCP_SUBNET";
    const excludedStart = value("ciscoExcludedStart") || gateway;
    const excludedEnd = value("ciscoExcludedEnd") || gateway;
    page.querySelector("#ciscoInterfaceConfig").textContent = `interface ${iface}\n description ${description}\n ip address ${gateway} ${result.subnetMask}\n no shutdown`;
    page.querySelector("#ciscoDhcpConfig").textContent = `ip dhcp excluded-address ${excludedStart} ${excludedEnd}\n\nip dhcp pool ${pool}\n network ${result.networkAddress} ${result.subnetMask}\n default-router ${gateway}\n dns-server 10.20.100.2 10.26.100.2`;
  }

  function sendToDhcpGenerator(page, result) {
    location.hash = "#dhcp";
    setTimeout(() => {
      if (typeof window.addPool === "function") window.addPool();
      const cards = Array.from(document.querySelectorAll(".pool-card"));
      const card = cards[cards.length - 1];
      const vlan = page.querySelector("#ciscoVlan").value.trim() || "10";
      const strategy = page.querySelector("#ciscoGatewayStrategy").value;
      const gateway = strategy === "last" ? result.lastUsableHost : strategy === "custom" && page.querySelector("#ciscoCustomGateway").value.trim() ? page.querySelector("#ciscoCustomGateway").value.trim() : result.firstUsableHost;
      if (card) {
        const firstInput = card.querySelector("[oninput*='updateField']");
        const id = firstInput?.getAttribute("oninput")?.match(/updateField\((\d+),/)?.[1];
        const updates = {
          name: page.querySelector("#ciscoPool").value.trim() || `Subnet_${vlan}`,
          macRaw: "",
          ip: "",
          gateway,
          subnet: result.subnetMask,
          vlan,
          interfaceName: page.querySelector("#ciscoInterface").value.trim() || `Vlan${vlan}`,
        };
        if (id && typeof window.updateField === "function") {
          Object.entries(updates).forEach(([field, value]) => window.updateField(Number(id), field, value));
        }
        setTimeout(() => {
          const freshCards = Array.from(document.querySelectorAll(".pool-card"));
          const fresh = freshCards[freshCards.length - 1];
          fresh?.querySelectorAll('input[placeholder="MAC Address"],input[placeholder="IP Address"]').forEach((input) => {
            input.classList.add("subnet-needs-input");
          });
        }, 0);
      }
      showToast("ส่งข้อมูล Subnet ไปหน้า DHCP Generator แล้ว");
    }, 160);
  }

  function addHistory(result) {
    const history = loadJson(HISTORY_KEY, []);
    const entry = { ip: result.ipAddress, prefix: result.prefix, cidr: result.cidrNotation, time: new Date().toLocaleString("th-TH") };
    const next = [entry, ...history.filter((item) => item.cidr !== entry.cidr)].slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  function renderHistory(page, recalc) {
    const host = page.querySelector("#subnetHistory");
    const history = loadJson(HISTORY_KEY, []);
    host.innerHTML = history.length ? history.map((item) => `<button data-history-ip="${item.ip}" data-history-prefix="${item.prefix}"><strong>${item.cidr}</strong><span>${item.time}</span></button>`).join("") : "<p>ยังไม่มีประวัติการคำนวณ</p>";
    host.querySelectorAll("[data-history-ip]").forEach((btn) => btn.addEventListener("click", () => {
      page.querySelector("#subnetIpInput").value = btn.dataset.historyIp;
      page.querySelector("#subnetPrefixInput").value = btn.dataset.historyPrefix;
      page.querySelector("#subnetPrefixSlider").value = btn.dataset.historyPrefix;
      page.querySelector("#subnetMaskInput").value = prefixToMask(btn.dataset.historyPrefix);
      activateTab(page, "ip");
      recalc(true);
    }));
  }

  function exportSplitCsv(rows) {
    if (!rows.length) return showToast("ยังไม่มีตาราง Split Network", "error");
    const csv = ["#,Network/CIDR,First Host,Last Host,Broadcast,Usable Hosts", ...rows.map(splitRowText)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "split-network.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function copyText(text, message) {
    copyToClipboard(text).then(() => showToast(message));
  }

  function loadJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  function debounce(fn, delay) {
    let timer = 0;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSubnetCalculator, { once: true });
    else initSubnetCalculator();
  }

  return {
    isValidIPv4,
    ipToUint32,
    uint32ToIp,
    prefixToMask,
    maskToPrefix,
    getWildcardMask,
    calculateSubnet,
    calculateRequiredPrefix,
    splitNetwork,
    classifyIp,
    formatNumber,
    copyToClipboard,
    showToast,
    parseCidrInput,
    initSubnetCalculator,
  };
});
