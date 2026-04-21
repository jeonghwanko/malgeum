/** Shared SVG path builders for horizontal scrolling line charts */

export function buildSmoothPath(xs: number[], ys: number[]): string {
  if (xs.length < 2) return "";
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2;
    d += ` C${cpx},${ys[i - 1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`;
  }
  return d;
}

export function buildFillPath(xs: number[], ys: number[], chartH: number): string {
  if (xs.length < 2) return "";
  return `${buildSmoothPath(xs, ys)} L${xs[xs.length - 1]},${chartH} L${xs[0]},${chartH} Z`;
}
