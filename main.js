import Delaunator from "https://cdn.skypack.dev/delaunator@5.0.0";
import Voronoi from "./rhill-voronoi-core.js";
const options = window.location.search;

let transparency = 0.2;
let dtMultiplier = 1;
let particleMultiplier = 1;
let color = "#ffffff";
let randomParticleColors = false;
let delaunay = true;
let voronoi = false;
let metaballs = false;

options
  .slice(1)
  .split("&")
  .forEach((option) => {
    const [key, value] = option.split("=");
    if (key === "transparency" || key === "t") {
      transparency = parseFloat(value);
    } else if (key === "dt") {
      dtMultiplier = parseFloat(value);
    } else if (key === "particleMultiplier" || key === "pm") {
      particleMultiplier = parseFloat(value);
    } else if (key === "color" || key === "c") {
      color = value;
    } else if (key === "randomParticleColors" || key === "rpc") {
      randomParticleColors = true;
    } else if (key === "d") {
      delaunay = true;
      voronoi = false;
      metaballs = false;
    } else if (key === "v") {
      voronoi = true;
      delaunay = false;
      metaballs = false;
    } else if (key === "m") {
      metaballs = true;
      delaunay = false;
      voronoi = false;
    }
  });
if (metaballs) {
  transparency = 0;
}
if (voronoi){
  dtMultiplier/=2
}
let voronoiObject = new Voronoi();
/** @type {{vertices:Voronoi[],edges:Voronoi.Edge[],cells:Voronoi.Cell[]}} */
var diagram;
const PI2 = 2 * Math.PI;
/** @type {HTMLCanvasElement} */
const canvas = document
  .querySelector("html")
  .appendChild(document.createElement("canvas"));
const ctx = canvas.getContext("2d");
let ch = (canvas.height = window.innerHeight);
let cw = (canvas.width = window.innerWidth);

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.moves = false;
    const angle = Math.random() * PI2;
    this.vx = Math.cos(angle);
    this.vy = Math.sin(angle) + Math.random();
    this.color = !randomParticleColors
      ? "#ffffff"
      : `hsl(${Math.random() * 360}, 100%, 50%)`;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return this;
  }
  changeColor(color) {
    if (color) {
      this.color = color;
    } else {
      this.color = !randomParticleColors
        ? "#ffffff"
        : `hsl(${Math.random() * 360}, 100%, 50%)`;
    }
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

/**
 * @param {Point[]} points
 * @param {CanvasRenderingContext2D} ctx
 */
function render(points, ctx) {
  ctx.fillStyle = color;
  points.forEach((element) => {
    ctx.fillStyle = element.color;
    ctx.beginPath();
    ctx.arc(element.x, element.y, 4, 0, PI2);
    ctx.fill();
  });
  function drawTlines(triangle, a, b) {
    let pointA = triangle[a];
    let pointB = triangle[b];
    const gradient = ctx.createLinearGradient(
      pointA.x,
      pointA.y,
      pointB.x,
      pointB.y
    );
    gradient.addColorStop(0, pointA.color);
    gradient.addColorStop(1, pointB.color);

    ctx.strokeStyle = gradient;
    ctx.beginPath();

    ctx.moveTo(pointA.x, pointA.y);
    ctx.lineTo(pointB.x, pointB.y);
    ctx.stroke();
  }
  if (delaunay) {
    let tris = getTriangles(points);
    tris.forEach((triangle) => {
      // drawTlines();


      drawTlines(triangle, 0, 1);
      drawTlines(triangle, 1, 2);
      drawTlines(triangle, 2, 0);
    });
  }
  else if (voronoi) {
    if (diagram) {
      voronoiObject.recycle(diagram);
    }
    diagram = voronoiObject.compute(points, { xl: 0, xr: cw, yt: 0, yb: ch });
    diagram.cells.forEach(
      /**@param {{site:Point,halfedges:Voronoi.Halfedge[]}} v*/
      (v) => {
        /**@type {Set<{x:number,y:number}>} */
        ctx.beginPath();
        ctx.fillStyle=v.site.color;
        v.halfedges.forEach(
          /**@param {{site:Point,getStartpoint:()=>{x:number,y:number},getEndpoint:()=>{x:number,y:number}}} e*/
          (e) => {
            
            let v1=e.getStartpoint()
            let v2=e.getEndpoint()
            ctx.lineTo(v1.x,v1.y)
            ctx.lineTo(v2.x,v2.y)
          });
          
          ctx.fill()
      });
  } else if (metaballs) {
    //todo
  }
}

ctx.fillStyle = "black";
ctx.fillRect(0, 0, cw, ch);
ctx.strokeStyle = "white";

let points = [];
function addpoints() {
  points = [];
  for (
    let index = 0;
    index < Math.round(Math.sqrt(ch * cw) / 3) * particleMultiplier;
    index++
  ) {
    points.push(new Point(Math.random() * cw, Math.random() * ch));
    points[index].moves = true;
  }
}
window.onresize = () => {
  ch = canvas.height = window.innerHeight;
  cw = canvas.width = window.innerWidth;
  addpoints();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, cw, ch);
  ctx.strokeStyle = "white";
};
addpoints();

let st = Date.now();
let et = Date.now();

function animate() {
  let dt = et - st;
  st = Date.now();

  ctx.fillStyle = "black";
  ctx.globalAlpha = transparency;
  ctx.fillRect(0, 0, cw, ch);
  ctx.globalAlpha = 1;
  render(points, ctx);

  points = points.map(
    /** @param {Point} v*/(v) => {
      if (v.moves) {
        let vt = v.update((dt / 5) * dtMultiplier);
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
          v.x = x;
          v.y = y;
          v.vx = Math.cos(angle) + Math.random() / 2 - 0.25;
          v.vy = Math.sin(angle) + Math.random() / 2 - 0.25;
          v.changeColor();
          return v;
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
