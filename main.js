/* =========================================================
   main.js — ONU Femmes WCARO WOW Brief
   - KPI inject + counter animation
   - Smooth scroll buttons
   - IntersectionObserver reveal
   - Expand/collapse all <details>
   - Chart.js donut + horizontal bars
   ========================================================= */

console.log("✅ main.js chargé");

const KPI = [
  { value: "24", label: "Pays (région)", foot: "AOC" },
  { value: "11", label: "Pays fragiles", foot: "sur 24" },
  { value: "50M", label: "Exposés inséc. alimentaire", foot: "2024" },
  { value: "14,3M", label: "Dans le besoin (A. Ouest)", foot: "2024" },
  { value: "10,2M", label: "Dans le besoin (Lac Tchad)", foot: "2024" },
  { value: "25,4M", label: "Dans le besoin (RDC)", foot: "2023–2024" },
  { value: "39%", label: "Besoins genre financés", foot: "estimation doc" },
  { value: "0,2%", label: "Aide bilatérale → localisation", foot: "WLO/WRO" },
];

function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function mountKpis(){
  const grid = $("#kpiGrid");
  if(!grid) return;
  grid.innerHTML = KPI.map(k => `
    <div class="kpi">
      <div class="kpi-value" data-counter="${k.value}">${k.value}</div>
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-foot">${k.foot || ""}</div>
    </div>
  `).join("");
}

function parseCounter(v){
  // returns {num, suffix, isPercent, hasComma}
  const s = String(v).trim();
  const isPercent = s.includes("%");
  const cleaned = s.replace(/\s/g,'');
  const match = cleaned.match(/^([\d.,]+)([A-Za-z]+)?%?$/);
  if(!match) return {num:null, suffix:"", isPercent, raw:s};
  const numStr = match[1];
  const suffix = match[2] || "";
  // replace comma decimal to dot if needed
  const n = Number(numStr.replace(/\./g,'').replace(',', '.')); // handles "14,3" -> 14.3, "50" -> 50
  return {num:n, suffix, isPercent, raw:s, numStr};
}

function animateCounters(){
  const els = $all("[data-counter]");
  els.forEach(el => {
    const targetRaw = el.getAttribute("data-counter");
    const parsed = parseCounter(targetRaw);
    if(parsed.num === null || Number.isNaN(parsed.num)) return;

    // heuristics: if suffix has 'M' treat as million display with 'M'
    const suffix = parsed.raw.replace(/[\d.,\s]/g,''); // keep letters & %
    const isM = suffix.includes("M");
    const isPercent = suffix.includes("%");
    const hasDecimal = /,|\./.test(parsed.raw.replace(/\s/g,''));

    const duration = 900 + Math.random()*450;
    const start = performance.now();

    function tick(now){
      const t = Math.min(1, (now - start)/duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = parsed.num * eased;

      let out;
      if(isPercent){
        // keep decimals if needed
        out = hasDecimal ? val.toFixed(1).replace('.', ',') : Math.round(val).toString();
        out += "%";
      } else if(isM){
        // show as "50M"
        out = (hasDecimal ? val.toFixed(1) : Math.round(val).toString()).replace('.', ',') + "M";
      } else {
        out = hasDecimal ? val.toFixed(1).replace('.', ',') : Math.round(val).toString();
      }

      el.textContent = out;
      if(t < 1) requestAnimationFrame(tick);
      else el.textContent = targetRaw; // ensure exact final
    }
    requestAnimationFrame(tick);
  });
}

function smoothScrollTo(id){
  const el = document.querySelector(id);
  if(!el) return;
  el.scrollIntoView({behavior:"smooth", block:"start"});
}

function mountScrollButtons(){
  $all("[data-scroll]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const target = btn.getAttribute("data-scroll");
      smoothScrollTo(target);
    });
  });

  const fab = $("#fabTop");
  if(fab){
    fab.addEventListener("click", ()=> window.scrollTo({top:0, behavior:"smooth"}));
  }
}

function mountPrint(){
  const btn = $("#btnPrint");
  if(btn) btn.addEventListener("click", ()=> window.print());
}

function mountExpandAll(){
  const btn = $("#btnExpandAll");
  if(!btn) return;
  btn.addEventListener("click", ()=>{
    const details = $all("details.details");
    const allOpen = details.every(d=>d.open);
    details.forEach(d=> d.open = !allOpen);
    btn.textContent = allOpen ? "Ouvrir tous les détails" : "Fermer tous les détails";
  });
}

function mountContact(){
  const btn = $("#btnContact");
  const card = $("#contactCard");
  if(!btn || !card) return;
  btn.addEventListener("click", ()=>{
    card.hidden = !card.hidden;
    btn.textContent = card.hidden ? "Proposer un appui" : "Masquer";
  });
}

function mountReveal(){
  const els = $all(".reveal");
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  }, {threshold: 0.12});

  els.forEach(el=> io.observe(el));
}

function buildCharts(){
  const donutEl = document.getElementById("chartDonut");
  const barsEl = document.getElementById("chartBars");

  // Donut: illustrative shares (replace later)
  if(donutEl){
    new Chart(donutEl, {
      type: "doughnut",
      data: {
        labels: ["Protection & VBG", "Insécurité alimentaire", "Déplacements", "Accès services", "Autres"],
        datasets: [{
          data: [32, 24, 22, 14, 8],
          borderWidth: 0,
          hoverOffset: 6,
          // no explicit colors requested? user asked blue/orange. We'll use a minimal palette using CSS var via computed style:
          backgroundColor: [
            getComputedStyle(document.documentElement).getPropertyValue("--uw-orange").trim(),
            getComputedStyle(document.documentElement).getPropertyValue("--uw-blue").trim(),
            "rgba(255,255,255,0.25)",
            "rgba(255,255,255,0.18)",
            "rgba(255,255,255,0.12)",
          ],
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom", labels: { color: "rgba(255,255,255,0.78)" } },
          tooltip: { enabled: true }
        },
        cutout: "62%"
      }
    });
  }

  // Bars: key “people in need” markers from doc
  if(barsEl){
    new Chart(barsEl, {
      type: "bar",
      data: {
        labels: ["RDC", "Afrique de l’Ouest", "Lac Tchad"],
        datasets: [{
          label: "Personnes dans le besoin (M)",
          data: [25.4, 14.3, 10.2],
          borderWidth: 0,
          backgroundColor: [
            getComputedStyle(document.documentElement).getPropertyValue("--uw-blue").trim(),
            "rgba(0,162,215,0.55)",
            "rgba(245,130,32,0.65)"
          ]
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            ticks: { color: "rgba(255,255,255,0.78)" },
            grid: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            ticks: { color: "rgba(255,255,255,0.82)" },
            grid: { display: false }
          }
        }
      }
    });
  }
}

function mountSmartNavbar(){
  // highlight active section
  const links = $all(".nav a");
  if(!links.length) return;

  const sections = links
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const id = "#" + e.target.id;
        links.forEach(l=>{
          const active = l.getAttribute("href") === id;
          l.style.background = active ? "rgba(255,255,255,0.08)" : "transparent";
          l.style.borderColor = active ? "rgba(255,255,255,0.14)" : "transparent";
        });
      }
    });
  }, {threshold: 0.35});

  sections.forEach(s=> io.observe(s));
}

/* init */
mountKpis();
mountReveal();
mountScrollButtons();
mountPrint();
mountExpandAll();
mountContact();
buildCharts();
mountSmartNavbar();

// animate counters when hero is visible
window.addEventListener("load", ()=> {
  setTimeout(()=> animateCounters(), 250);
});
