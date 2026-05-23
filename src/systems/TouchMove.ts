/**
 * Sterowanie dotykiem (PRD/issue #8): czysta logika „statek podąża za palcem".
 * Bez Phasera — testowalna w środowisku `node`.
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Wektor sterowania (-1..1 na oś) prowadzący statek z `cur` do `target` (palec).
 * W promieniu `deadzone` zwraca 0 (brak drgań przy stojącym palcu); poza nim
 * narasta proporcjonalnie do dystansu i jest clampowany do ±1 w obrębie `range`.
 */
export function followDrive(cur: Vec2, target: Vec2, deadzone: number, range: number): Vec2 {
  return {
    x: axis(target.x - cur.x, deadzone, range),
    y: axis(target.y - cur.y, deadzone, range),
  };
}

function axis(delta: number, deadzone: number, range: number): number {
  const mag = Math.abs(delta);
  if (mag <= deadzone) return 0;
  return Math.sign(delta) * Math.min(1, (mag - deadzone) / range);
}
