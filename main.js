import Delaunator from "https://cdn.skypack.dev/delaunator@5.0.0";
const PI2 = 2 * Math.PI;
/** @type {HTMLCanvasElement} */
const canvas = document
  .querySelector("html")
  .appendChild(document.createElement("canvas"));
const ctx = canvas.getContext("2d");
const ch = (canvas.height = window.innerHeight);
const cw = (canvas.width = window.innerWidth);
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.moves = false;
    const angle = Math.random() * PI2;
    this.vx = Math.cos(angle);
    this.vy = Math.sin(angle) + Math.random();
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return this;
  }
}
/**
 * @param {Point[]} points
 */

function getTriangles(points) {
  let p = [];
  for (let i = 0; i < points.length; i++) {
    p.push(points[i].x);
    p.push(points[i].y);
  }
  let delu = new Delaunator(p);
  let triangles = delu.triangles;
  let coordinates = [];
  for (let i = 0; i < triangles.length; i += 3) {
    coordinates.push([
      points[triangles[i]],
      points[triangles[i + 1]],
      points[triangles[i + 2]],
    ]);
  }
  return coordinates;
}
function fallOff(x1, y1, x2, y2) {
  const distanceSquared = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
  const fallOffValue = 5 - 2 * distanceSquared;
  return Math.max(0.5, fallOffValue);
}
/**
 * @param {Point[]} points
 * @param {CanvasRenderingContext2D} ctx
 */
function render(points, ctx) {
  ctx.fillStyle = "white";
  points.forEach((element) => {
    ctx.beginPath();
    ctx.arc(element.x, element.y, 4, 0, PI2);
    ctx.fill();
  });
  let tris = getTriangles(points);
  tris.forEach((triangle) => {
    // drawTlines();
    function drawTlines(triangle, a, b) {
      ctx.beginPath();
      ctx.lineWidth = fallOff(
        triangle[a].x,
        triangle[a].y,
        triangle[b].x,
        triangle[b].y
      );
      ctx.moveTo(triangle[a].x, triangle[a].y);
      ctx.lineTo(triangle[b].x, triangle[b].y);
      ctx.stroke();
    }

    drawTlines(triangle, 0, 1);
    drawTlines(triangle, 1, 2);
    drawTlines(triangle, 2, 0);
  });
}

ctx.fillStyle = "black";
ctx.fillRect(0, 0, cw, ch);
ctx.strokeStyle = "white";

let points = [];
for (let index = 0; index < Math.round(Math.sqrt(ch * cw) / 3); index++) {
  points.push(new Point(Math.random() * cw, Math.random() * ch));
  points[index].moves = true;
}
let st = Date.now();
let et = Date.now();
function animate() {
  let dt = et - st;
  st = Date.now();

  ctx.fillStyle = "black";
  ctx.globalAlpha = 0.2;
  ctx.fillRect(0, 0, cw, ch);
  ctx.globalAlpha = 1;
  render(points, ctx);

  points = points.map(
    /** @param {Point} v*/ (v) => {
      if (v.moves) {
        let vt = v.update(dt / 5);
        if (vt.x >= cw || vt.x <= 0 || vt.y >= ch || vt.y <= 0) {
          let x, y;
          if (Math.random() > 0.5) {
            x = Math.random() > 0.5 ? 2 : cw - 2;
            y = Math.random() * ch;
          } else {
            x = Math.random() * cw;
            y = Math.random() > 0.5 ? 2 : ch - 2;
          }
          const angle =
            Math.atan2(ch / 2 - y, cw / 2 - x) + Math.random() - 0.5;
          let p = new Point(x, y);
          p.vx = Math.cos(angle);
          p.vy = Math.sin(angle) + Math.random();
          p.moves = true;
          return p;
        } else {
          return vt;
        }
      } else {
        return v;
      }
    }
  );

  et = Date.now();

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
