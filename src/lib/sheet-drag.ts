// Când se închide panoul de jos tras cu degetul: destul de departe sau „aruncat” repede în jos.
const DISTANCE_SHARE = 0.3;

const FLICK_VELOCITY = 0.5;

const FLICK_MIN_DISTANCE = 30;

// dy: cât a fost tras în jos (px), height: înălțimea panoului (px), velocity: viteza la eliberare (px/ms, pozitiv = în jos)
export function shouldDismiss(dy: number, height: number, velocity: number): boolean {
  if (dy <= 0) {
    return false;
  }

  return dy > height * DISTANCE_SHARE || (velocity > FLICK_VELOCITY && dy > FLICK_MIN_DISTANCE);
}
