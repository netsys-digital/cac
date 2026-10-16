import { readFileSync, writeFileSync } from 'node:fs';

const topo = JSON.parse(readFileSync('/tmp/countries-110m.json', 'utf8'));
const { scale, translate } = topo.transform;

function decodeArc(arc) {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
}

const arcs = topo.arcs.map(decodeArc);

function ring(indices) {
  const points = [];
  for (const index of indices) {
    const reversed = index < 0;
    const arc = arcs[reversed ? ~index : index];
    const seq = reversed ? arc.slice().reverse() : arc;
    if (points.length) seq.shift();
    points.push(...seq);
  }
  return points;
}

const W = 1000;
const H = 500;

function project([lon, lat]) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

function pathFromPolygon(polygon) {
  return polygon
    .map((indices) => {
      const pts = ring(indices).map(project);
      if (pts.length < 3) return '';
      let minX = Infinity;
      let maxX = -Infinity;
      for (const [x] of pts) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
      // Anéis que cruzam o antimeridiano viram uma faixa horizontal no mapa.
      if (maxX - minX > 420) return '';
      return pts
        .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
        .join('') + 'Z';
    })
    .join('');
}

const fills = ['#d7e7c8', '#e7efc4', '#c9dfc2', '#efe6b8', '#d3e4d4', '#e4edc9', '#cfe3d0'];

const SKIP = new Set(['010']);

const countries = topo.objects.countries.geometries
  .filter((geometry) => !SKIP.has(String(geometry.id).padStart(3, '0')))
  .map((geometry, index) => {
    const polygons =
      geometry.type === 'Polygon' ? [geometry.arcs] : geometry.type === 'MultiPolygon' ? geometry.arcs : [];
    const d = polygons.map(pathFromPolygon).join('');
    return {
      id: geometry.id,
      d,
      fill: fills[index % fills.length],
    };
  });

const viewX = 0;
const viewY = 42;
const viewW = 1000;
const viewH = 368;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX} ${viewY} ${viewW} ${viewH}" fill="none">
${countries
  .filter((c) => c.d)
  .map((c) => `  <path data-id="${c.id}" d="${c.d}" fill="${c.fill}" stroke="#ffffff" stroke-width="0.55"/>`)
  .join('\n')}
</svg>
`;

writeFileSync(new URL('../src/app/components/world-map.svg', import.meta.url), svg);
console.log('countries', countries.length, 'bytes', svg.length);

const watch = new Set(['076', '840', '250', '404', '170', '036', '156', '356', '566', '710', '124', '484', '032', '276']);
for (const geometry of topo.objects.countries.geometries) {
  const id = String(geometry.id).padStart(3, '0');
  if (!watch.has(id)) continue;
  const polygons =
    geometry.type === 'Polygon' ? [geometry.arcs] : geometry.type === 'MultiPolygon' ? geometry.arcs : [];
  const pts = [];
  for (const polygon of polygons) {
    for (const indices of polygon) {
      const ringPts = ring(indices).map(project);
      let minX = Infinity;
      let maxX = -Infinity;
      for (const [x] of ringPts) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
      if (maxX - minX > 420) continue;
      pts.push(...ringPts);
    }
  }
  if (!pts.length) continue;
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const px = ((cx - viewX) / viewW) * 100;
  const py = ((cy - viewY) / viewH) * 100;
  console.log(id, px.toFixed(1), py.toFixed(1));
}
