const test = require('node:test'), assert = require('node:assert'), F = require('../js/finance');
const near = (a, b, e = 0.005) => assert.ok(Math.abs(a - b) <= e, `${a} ≉ ${b}`);
const L = { id: 'x', type: 'SIMPLE', amount: 100000, bullet: 30000, n: 23, start: '2024-04-01', concept: 'MD', spread: 2.75 };

test('amortización con bullet (valores del mockup)', () => {
  const s = F.schedule(L, [{ date: '2024-04-01', rate: 8.0327 }]);
  assert.equal(s.length, 24); near(s[0].payment, 3043.478, 0.001); near(9 * s[0].payment, 27391.30, 0.01);
  near(s.reduce((a, r) => a + r.payment, 0), 100000); near(s[23].payment, 30000); near(s[23].bal, 0);
});
test('interés diario cuenta corriente = saldo×(TIIE+sobretasa)/360', () => {
  const r = F.accrual({ type: 'CC', spread: 2.75 }, [{ date: '2025-08-15', kind: 'C', amount: 5e7 }], [{ date: '2025-08-14', rate: 8.0126 }], '2025-08-17');
  assert.equal(F.r2(r.rows[0].i), 14948.06); assert.equal(r.rows.length, 3);
});
test('días hábiles', () => { assert.equal(F.nextBD('2025-09-13'), '2025-09-15'); assert.equal(F.nextBD('2025-09-16'), '2025-09-17'); });
test('conciliación (CP-012)', () => {
  assert.deepEqual(F.reconcile(4500, 4700), { diff: 200, status: 'BANK_HIGHER' }); assert.equal(F.reconcile(1, null).status, 'PENDING');
});
