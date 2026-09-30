from pathlib import Path
import re

index = Path("index.html").read_text(encoding="utf-8")

assert Path("scripts/add-system-owner-finder.py").exists(), "system owner generator must exist"
assert Path("tor-system-finder.html").exists(), "TOR System Finder source page must exist"

source = Path("tor-system-finder.html").read_text(encoding="utf-8")
assert "TOR SYSTEM FINDER" in source, "source must preserve TOR System Finder identity"
assert "const BUNDLED_TOR=" in source, "bundled TOR database must be preserved"
assert "function findMatches(" in source, "matching engine must be preserved"
assert "async function parseTorXlsx(" in source, "Excel import parser must be preserved"
assert "CONTACT ROUTING" in source, "contact routing UI must be preserved"
assert "Import TOR Excel" in source, "TOR Excel import flow must be preserved"
assert "data-host-theme" in source, "embedded finder must expose host theme state"
assert "message" in source and "system-owner-theme" in source, "finder must accept parent theme sync messages"

assert 'id="btnSystemOwnerFinder"' in index, "Generate Log traffic must include FIND SYSTEM OWNER button"
assert "FIND SYSTEM OWNER" in index, "system owner button must use approved English label"
assert 'id="systemOwnerFinderPanel"' in index, "system owner finder panel must be embedded in Generate Log traffic"
assert 'id="systemOwnerFinderFrame"' in index, "finder must render in an isolated embedded frame"
assert 'src="tor-system-finder.html"' in index, "finder frame must load the supplied TOR tool"
assert "toggleSystemOwnerFinder" in index, "finder panel must open and close in place"
assert "syncSystemOwnerFinderTheme" in index, "finder theme must follow the host GOLD/CYBER theme"
assert "system-owner-finder" in index, "finder styles must be namespaced from the existing traffic UI"

# Existing Generate Log behavior must remain present and independent.
assert "function generateLogs()" in index, "existing Generate Logs function must remain"
assert index.count("function generateLogs()") == 1, "system owner integration must not duplicate Generate Logs"
assert "VIEW ONLY · ไม่รวมใน COPY" in index, "IP Reputation copy-isolation contract must remain"

# The system-owner panel should sit before the existing Generate Logs action, not replace it.
panel_pos = index.find('id="systemOwnerFinderPanel"')
generate_pos = index.find('onclick="generateLogs()"')
assert panel_pos >= 0 and generate_pos > panel_pos, "system owner panel must remain inside traffic flow before Generate Logs"

print("system owner finder integration contract: OK")
