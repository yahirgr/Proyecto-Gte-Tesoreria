/* Motor financiero compartido (backend Node + frontend navegador). Sin dependencias ni I/O.
   Convenciones: tasas en %, interés = saldo × (TIIE + sobretasa)/100 × días/base (360 por defecto). */
(function (root, make) { if (typeof module === 'object' && module.exports) module.exports = make(); else root.Finance = make(); })(typeof self !== 'undefined' ? self : this, function () {
  const D = s => new Date(s + 'T00:00:00Z'), iso = d => d.toISOString().slice(0, 10);
  const days = (a, b) => Math.round((D(b) - D(a)) / 864e5), plus = (s, n) => iso(new Date(D(s).getTime() + n * 864e5));
  const eom = (y, m) => new Date(Date.UTC(y, m + 1, 0)), r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

  // ---- Días hábiles bancarios (festivos fijos LFT; agrega extras como 2º argumento, p. ej. Semana Santa) ----
  const nthMon = (y, m, n) => { const d = new Date(Date.UTC(y, m, 1)); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1); d.setUTCDate(d.getUTCDate() + 7 * (n - 1)); return iso(d); };
  const hol = y => new Set([y + '-01-01', nthMon(y, 1, 1), nthMon(y, 2, 3), y + '-05-01', y + '-09-16', nthMon(y, 10, 3), y + '-12-25']);
  const isBD = (s, x = []) => { const w = D(s).getUTCDay(); return w !== 0 && w !== 6 && !hol(+s.slice(0, 4)).has(s) && !x.includes(s); };
  const nextBD = (s, x) => { while (!isBD(s, x)) s = plus(s, 1); return s; };

  // ---- Fechas de cobro según concepto: FM fin de mes · MD mismo día · DH día hábil siguiente ----
  const addM = (s, k) => { const d = D(s), dy = d.getUTCDate(); d.setUTCMonth(d.getUTCMonth() + k, 1); d.setUTCDate(Math.min(dy, eom(d.getUTCFullYear(), d.getUTCMonth()).getUTCDate())); return iso(d); };
  const payDate = (l, k, x) => { let b = addM(l.start, k); if (l.concept === 'FM') { const d = D(b); b = iso(eom(d.getUTCFullYear(), d.getUTCMonth())); } return l.concept === 'DH' ? nextBD(b, x) : b; };

  // ---- TIIE vigente: última tasa capturada ≤ fecha (carry-forward); si no hay anterior, la primera ----
  const rateAt = (rs, d, def = 8.0126) => { let v = def; [...rs].sort((a, b) => a.date < b.date ? -1 : 1).forEach((x, i) => { if (i === 0) v = x.rate; if (x.date <= d) v = x.rate; }); return v; };

  // ---- Crédito simple con bullet: A=(P−B)/n · saldo_k=P−Σpagos · interés=saldo inicial×(TIIE+σ)×días/360 ----
  const schedule = (l, rs, x) => {
    const n = Math.max(1, l.n | 0), cap = l.amount - l.bullet, A = cap / n; let bal = cap, tot = l.amount, prev = l.start; const R = [];
    for (let k = 1; k <= n + (l.bullet > 0 ? 1 : 0); k++) {
      const bl = k > n, pd = payDate(l, k, x), pay = bl ? l.bullet : k === n ? bal : A, r = rateAt(rs, pd) + l.spread, om = tot * r / 100 * days(prev, pd) / 360;
      if (!bl) bal -= pay; tot -= pay;
      R.push({ k, from: prev, pay: pd, rate: r, payment: pay, bal: tot, omex: om, bank: l.bi?.[k] ?? null }); prev = pd;
    }
    return R;
  };

  // ---- Cuenta corriente: saldo diario (cargo=disposición, abono=pago) e interés diario ----
  const bal = (mv, as) => mv.filter(x => x.date <= as).reduce((a, x) => a + (x.kind === 'C' ? x.amount : -x.amount), 0);
  const accrual = (l, mv, rs, as) => {
    const M = mv.filter(x => x.date <= as).sort((a, b) => a.date < b.date ? -1 : 1), B = l.basis || 360; if (!M.length) return { rows: [], tot: 0 };
    let d = M[0].date, b = 0, tot = 0; const rows = [];
    while (d <= as) { let c = 0, a = 0; M.filter(x => x.date === d).forEach(x => x.kind === 'C' ? c += x.amount : a += x.amount); b += c - a; const t = rateAt(rs, d), r = t + l.spread, i = b * r / 100 / B; tot += i; rows.push({ d, c, a, b, t, sp: l.spread, r, i }); d = plus(d, 1); }
    return { rows, tot };
  };

  const debt = (l, rs, mv, as) => l.type === 'SIMPLE' ? (as < l.start ? 0 : l.amount - schedule(l, rs).filter(r => r.pay <= as).reduce((a, r) => a + r.payment, 0)) : bal(mv, as);
  // ---- Conciliación: Dif = Según banco − Ints. Omex ----
  const reconcile = (omex, bank, tol = 1) => { if (bank == null) return { diff: null, status: 'PENDING' }; const diff = r2(bank - omex); return { diff, status: Math.abs(diff) <= tol ? 'RECONCILED' : diff > 0 ? 'BANK_HIGHER' : 'OMEX_HIGHER' }; };
  const weighted = it => { const t = it.reduce((a, x) => a + x.d, 0); return t ? it.reduce((a, x) => a + x.d * x.r, 0) / t : 0; };

  return { D, iso, days, plus, addM, isBD, nextBD, payDate, rateAt, schedule, bal, accrual, debt, reconcile, weighted, r2 };
});
