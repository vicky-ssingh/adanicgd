import { NETWORK } from '@/config/network';
import { SCENARIOS } from '@/config/scenarios';
import { useSimStore } from '@/state/useSimStore';
import { fmt, fmtFlow, fmtPressure } from '@/utils/format';

/**
 * Builds a print-friendly HTML report of the current network state and opens it
 * in a new window with the browser print dialog (→ save as PDF). Presentation
 * feature — reads live sim values, changes nothing.
 */
export function exportReport() {
  const sim = useSimStore.getState();
  const a = sim.aggregates;
  const sc = SCENARIOS[sim.scenario];
  const now = new Date().toLocaleString('en-IN');

  const rows = NETWORK.nodes
    .map((n) => {
      const v = sim.values[n.id];
      if (!v) return '';
      return `<tr>
        <td>${n.label}</td>
        <td>${n.type}</td>
        <td>${fmtPressure(v.pressure)}</td>
        <td>${fmtFlow(v.flow)} SCMH</td>
        <td>${v.temperature.toFixed(1)} °C</td>
        <td class="s-${v.status}">${v.status.toUpperCase()}</td>
      </tr>`;
    })
    .join('');

  const kpis = [
    ['Total Gas Flow', `${fmtFlow(a.totalFlow)} SCMH`],
    ['Network Pressure', fmtPressure(a.networkPressure)],
    ['CNG Demand', `${fmtFlow(a.cngDemand)} SCMH`],
    ['PNG Demand', `${fmtFlow(a.pngDemand)} SCMH`],
    ['Active CNG Stations', fmt(a.activeCngStations)],
    ['Connected PNG Consumers', fmt(a.connectedPngConsumers)],
    ['Active PRS / DRS', fmt(a.activePrsDrs)],
    ['System Health', `${a.systemHealth}%`],
  ]
    .map(([k, val]) => `<div class="kpi"><span>${k}</span><b>${val}</b></div>`)
    .join('');

  const alerts = a.alerts.length
    ? a.alerts.map((x) => `<li>${x}</li>`).join('')
    : '<li>All systems nominal</li>';

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <title>Adani Shantigram CGD — Network Report</title>
  <style>
    *{box-sizing:border-box} body{font:13px/1.5 Inter,Arial,sans-serif;color:#0e1726;margin:32px;background:#fff}
    h1{font-size:20px;margin:0} .sub{color:#5a6673;font-size:12px;margin:2px 0 18px}
    .brand{color:#0b74b0;font-weight:800;letter-spacing:.5px}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0 20px}
    .kpi{border:1px solid #e2e6ea;border-radius:8px;padding:8px 10px;display:flex;flex-direction:column}
    .kpi span{font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:#7a8698}
    .kpi b{font-size:16px;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin-top:6px;font-size:12px}
    th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eef1f4}
    th{background:#f5f7fa;text-transform:uppercase;font-size:10px;letter-spacing:.4px;color:#5a6673}
    .s-online{color:#0b74b0;font-weight:700}.s-offline{color:#9fb2c8;font-weight:700}
    .s-warning{color:#c08a1e;font-weight:700}.s-critical{color:#bd3861;font-weight:700}
    h2{font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:#5a6673;margin:22px 0 6px}
    ul{margin:6px 0;padding-left:18px} .foot{margin-top:26px;color:#9fb2c8;font-size:11px}
    @media print{body{margin:12mm}}
  </style></head><body>
    <h1><span class="brand">adani</span> Shantigram — City Gas Distribution</h1>
    <div class="sub">Digital-Twin Network Report · Generated ${now}</div>
    <h2>Operating Scenario</h2>
    <div><b>${sc.label}</b> — ${sc.description}</div>
    <h2>Network Overview</h2>
    <div class="kpis">${kpis}</div>
    <h2>Component Status</h2>
    <table><thead><tr><th>Component</th><th>Type</th><th>Pressure</th><th>Flow</th><th>Temp</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <h2>Alerts</h2><ul>${alerts}</ul>
    <div class="foot">Powered by Adani Total Gas Limited — Shantigram, Ahmedabad · Simulated data</div>
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
  </body></html>`;

  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
