// ─── Plan Data ────────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Bronze",
    monthly_premium: 150,
    annual_limit: 500000,
    benefits: {
      outpatient: { limit_per_visit: 3000, visits_per_year: 30 },
      inpatient: { limit_per_day: 10000, days_per_year: 60 },
      dental: null,
      maternity: null,
    },
    copay_percentage: 20,
    waiting_period_days: 30,
    highlights: ["Basic coverage", "No dental or maternity"],
  },
  {
    name: "Silver",
    monthly_premium: 350,
    annual_limit: 1500000,
    benefits: {
      outpatient: { limit_per_visit: 5000, visits_per_year: 60 },
      inpatient: { limit_per_day: 25000, days_per_year: 120 },
      dental: { limit_per_year: 30000 },
      maternity: null,
    },
    copay_percentage: 10,
    waiting_period_days: 15,
    highlights: ["Includes dental", "Lower copay", "Higher limits"],
  },
  {
    name: "Gold",
    monthly_premium: 700,
    annual_limit: 5000000,
    benefits: {
      outpatient: { limit_per_visit: 10000, visits_per_year: -1 },
      inpatient: { limit_per_day: 50000, days_per_year: -1 },
      dental: { limit_per_year: 100000 },
      maternity: { limit_per_pregnancy: 200000 },
    },
    copay_percentage: 0,
    waiting_period_days: 0,
    highlights: ["Full coverage", "No copay", "No waiting period", "Unlimited visits"],
  },
];

// ─── Value-for-money Score ─────────────────────────────────────────────────────
// Higher score = better value
function valueScore(plan) {
  const annualCost = plan.monthly_premium * 12;
  const coverageRatio = plan.annual_limit / annualCost;
  const copayFactor = 1 - plan.copay_percentage / 100;
  const waitingFactor = 1 / (plan.waiting_period_days + 1);
  return coverageRatio * copayFactor * waitingFactor;
}

const scores = plans.map(valueScore);
const recommendedIndex = scores.indexOf(Math.max(...scores));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n === -1 ? "Unlimited" : n.toLocaleString("en-US");

const fmtCurrency = (n) =>
  n === -1 ? "Unlimited" : "$" + n.toLocaleString("en-US");

const checkIcon = `<span class="icon icon-yes" title="Included">&#10003;</span>`;
const crossIcon = `<span class="icon icon-no" title="Not included">&#10007;</span>`;

// ─── Best-value helpers ────────────────────────────────────────────────────────
// Returns array of column indices that share the best value
function bestCols(values) {
  const nums = values.map((v) => (v === null ? -Infinity : v));
  const max = Math.max(...nums);
  return nums.map((n) => n === max && max !== -Infinity);
}
function lowestCols(values) {
  const nums = values.map((v) => (v === null ? Infinity : v));
  const min = Math.min(...nums);
  return nums.map((n) => n === min && min !== Infinity);
}

// ─── Table Row Builders ────────────────────────────────────────────────────────
function makeRow(label, cells) {
  return `<tr>
    <td class="row-label">${label}</td>
    ${cells
      .map(
        (c) =>
          `<td class="cell ${c.best ? "best-value" : ""}">${c.html}</td>`
      )
      .join("")}
  </tr>`;
}

function buildTable() {
  const rows = [];

  // ── Monthly Premium (lowest = best)
  const premiums = plans.map((p) => p.monthly_premium);
  const bestPremium = lowestCols(premiums);
  rows.push(
    makeRow(
      "Monthly Premium",
      plans.map((p, i) => ({
        html: `<strong>${fmtCurrency(p.monthly_premium)}</strong><span class="sub">/month</span>`,
        best: bestPremium[i],
      }))
    )
  );

  // ── Annual Limit
  const limits = plans.map((p) => p.annual_limit);
  const bestLimit = bestCols(limits);
  rows.push(
    makeRow(
      "Annual Limit",
      plans.map((p, i) => ({
        html: `<strong>${fmtCurrency(p.annual_limit)}</strong>`,
        best: bestLimit[i],
      }))
    )
  );

  // ── Outpatient – Limit / Visit
  const opVisitLimits = plans.map((p) => p.benefits.outpatient?.limit_per_visit ?? null);
  const bestOpVisit = bestCols(opVisitLimits);
  rows.push(
    makeRow(
      "Outpatient<br><small>Limit / Visit</small>",
      plans.map((p, i) => ({
        html: `<strong>${fmtCurrency(opVisitLimits[i])}</strong>`,
        best: bestOpVisit[i],
      }))
    )
  );

  // ── Outpatient – Visits / Year
  const opVisits = plans.map((p) => p.benefits.outpatient?.visits_per_year ?? null);
  // -1 = unlimited → treat as Infinity for comparison
  const opVisitsNum = opVisits.map((v) => (v === -1 ? Infinity : v ?? -Infinity));
  const bestOpVisits = opVisitsNum.map((v) => v === Math.max(...opVisitsNum));
  rows.push(
    makeRow(
      "Outpatient<br><small>Visits / Year</small>",
      plans.map((p, i) => ({
        html: `<strong>${fmt(opVisits[i])}</strong>`,
        best: bestOpVisits[i],
      }))
    )
  );

  // ── Inpatient – Limit / Day
  const ipDayLimits = plans.map((p) => p.benefits.inpatient?.limit_per_day ?? null);
  const bestIpDay = bestCols(ipDayLimits);
  rows.push(
    makeRow(
      "Inpatient<br><small>Limit / Day</small>",
      plans.map((p, i) => ({
        html: `<strong>${fmtCurrency(ipDayLimits[i])}</strong>`,
        best: bestIpDay[i],
      }))
    )
  );

  // ── Inpatient – Days / Year
  const ipDays = plans.map((p) => p.benefits.inpatient?.days_per_year ?? null);
  const ipDaysNum = ipDays.map((v) => (v === -1 ? Infinity : v ?? -Infinity));
  const bestIpDays = ipDaysNum.map((v) => v === Math.max(...ipDaysNum));
  rows.push(
    makeRow(
      "Inpatient<br><small>Days / Year</small>",
      plans.map((p, i) => ({
        html: `<strong>${fmt(ipDays[i])}</strong>`,
        best: bestIpDays[i],
      }))
    )
  );

  // ── Dental
  const dentalLimits = plans.map((p) => p.benefits.dental?.limit_per_year ?? null);
  const bestDental = bestCols(dentalLimits);
  rows.push(
    makeRow(
      "Dental",
      plans.map((p, i) => ({
        html: p.benefits.dental
          ? `${checkIcon}<span class="benefit-detail">${fmtCurrency(dentalLimits[i])}<small>/year</small></span>`
          : crossIcon,
        best: bestDental[i],
      }))
    )
  );

  // ── Maternity
  const maternityLimits = plans.map((p) => p.benefits.maternity?.limit_per_pregnancy ?? null);
  const bestMaternity = bestCols(maternityLimits);
  rows.push(
    makeRow(
      "Maternity",
      plans.map((p, i) => ({
        html: p.benefits.maternity
          ? `${checkIcon}<span class="benefit-detail">${fmtCurrency(maternityLimits[i])}<small>/pregnancy</small></span>`
          : crossIcon,
        best: bestMaternity[i],
      }))
    )
  );

  // ── Co-pay % (lowest = best)
  const copays = plans.map((p) => p.copay_percentage);
  const bestCopay = lowestCols(copays);
  rows.push(
    makeRow(
      "Co-pay",
      plans.map((p, i) => ({
        html: `<strong>${p.copay_percentage}%</strong>`,
        best: bestCopay[i],
      }))
    )
  );

  // ── Waiting Period (lowest = best)
  const waiting = plans.map((p) => p.waiting_period_days);
  const bestWaiting = lowestCols(waiting);
  rows.push(
    makeRow(
      "Waiting Period",
      plans.map((p, i) => ({
        html: p.waiting_period_days === 0
          ? `<strong class="text-green">None</strong>`
          : `<strong>${p.waiting_period_days} days</strong>`,
        best: bestWaiting[i],
      }))
    )
  );

  return rows.join("");
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  const colors = ["bronze", "silver", "gold"];

  // Plan cards (mobile view)
  const cards = plans
    .map(
      (p, i) => `
    <div class="plan-card ${colors[i]} ${i === recommendedIndex ? "recommended-card" : ""}">
      ${i === recommendedIndex ? '<div class="badge-recommended">Recommended</div>' : ""}
      <div class="card-header">
        <div class="plan-icon ${colors[i]}-icon"></div>
        <h2 class="plan-name">${p.name}</h2>
        <div class="plan-price">
          <span class="price-amount">${fmtCurrency(p.monthly_premium)}</span>
          <span class="price-period">/month</span>
        </div>
      </div>
      <ul class="highlights">
        ${p.highlights.map((h) => `<li>${h}</li>`).join("")}
      </ul>
    </div>`
    )
    .join("");

  // Desktop comparison table header
  const thead = `<thead>
    <tr>
      <th class="corner-cell">Benefits</th>
      ${plans
        .map(
          (p, i) => `<th class="plan-header ${colors[i]}-header ${i === recommendedIndex ? "recommended-header" : ""}">
          ${i === recommendedIndex ? '<span class="badge-recommended">Recommended</span>' : ""}
          <div class="th-plan-name">${p.name}</div>
          <div class="th-plan-price">${fmtCurrency(p.monthly_premium)}<small>/mo</small></div>
        </th>`
        )
        .join("")}
    </tr>
  </thead>`;

  const tbody = `<tbody>${buildTable()}</tbody>`;

  const app = document.getElementById("app");
  app.innerHTML = `
    <section class="cards-section">${cards}</section>
    <section class="table-section">
      <div class="table-wrapper">
        <table class="comparison-table">
          ${thead}
          ${tbody}
        </table>
      </div>
      <p class="best-value-note">
        <span class="best-value-chip">Best</span> highlighted cells indicate the best value in each category.
      </p>
    </section>
  `;
}

render();
