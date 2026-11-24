import { geoEquirectangular, geoPath } from 'd3-geo'; import { feature } from 'topojson-client'; import fs from 'fs';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-110m.json'));
const land = feature(topo, topo.objects.land);
const W=1000,H=500; const proj = geoEquirectangular().scale(W/(2*Math.PI)).translate([W/2,H/2]);
const d = geoPath(proj)(land);
const pt=(lon,lat)=>proj([lon,lat]).map(v=>+v.toFixed(1));
fs.writeFileSync('src/mapdata.js', `export const LAND=${JSON.stringify(d)};\nexport const MAPW=${W},MAPH=${H};\nexport const TROPIC_N=${pt(0,23.4366)[1]},TROPIC_S=${pt(0,-23.4366)[1]};\nexport const EQUATOR=${pt(0,0)[1]};\nexport const MARK={brazil:${JSON.stringify(pt(-50,-12))},colombia:${JSON.stringify(pt(-74,4.5))},ethiopia:${JSON.stringify(pt(39.5,8))},vietnam:${JSON.stringify(pt(108,14))},indonesia:${JSON.stringify(pt(110,-2))}};\n`);
console.log(d.length);
