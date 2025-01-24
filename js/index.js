import { Attractors } from "./attractors.js";


(function() {
  const ITERATIONS = 50_000;
  const DEFAULTS = {
    a: -1.3, b: -1.3, c: -1.8, d: -1.9,
    showPoints: true, showTrails: true,
    attractor: 5
  };
  const MIN_COLORS = 5, MAX_COLORS = 15;
  const LINE_WIDTH = 0.25;
  const LINE_ALPHA = 0.022;
  const POINT_ALPHA = 0.06;

  const boostAlpha = navigator.userAgent.search("Firefox") > -1;

  const ui = initUI();
  setUI(DEFAULTS);

  document.addEventListener("keydown", (e) => {
    if (e.key === 'r') {
      randomizeParams();
      randomizeColors();
      runAttractor();
    }
  });

  const ctx = ui.canvas.getContext("2d");
  ctx.lineWidth = LINE_WIDTH;

  const path = Array.from({ length: ITERATIONS }, () => ({ x: 0, y: 0 }));
  let colors;

  randomizeColors()
  runAttractor()

  function randomizeColors() {
    let numColors = Math.random() * (MAX_COLORS - MIN_COLORS) + MIN_COLORS;
    colors = Array.from({ length: numColors }, () => '#' + (Math.random() * 0xFFFFFF << 0).toString(16))
  }

  function runAttractor() {
    ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);

    const params = readFromUI();


    // iterate attractor points and determine min/max bounds
    let x = 0.001, y = 0.001;
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      let [x1, y1] = Attractors[params.attractor].fn(x, y, params.a, params.b, params.c, params.d);

      path[i].x = x1;
      path[i].y = y1;

      minX = Math.min(minX, x1);
      maxX = Math.max(maxX, x1);
      minY = Math.min(minY, y1);
      maxY = Math.max(maxY, y1);

      x = x1;
      y = y1;
    }

    // determine scale of the attractor so that it can be properly centered and drawn in the canvas
    const scaleX = ui.canvas.width / (maxX - minX + 1e-20);
    const scaleY = ui.canvas.height / (maxY - minY + 1e-20);
    const scale = Math.min(scaleX, scaleY) * 0.8;
    const offsetX = ui.canvas.width / 2 - (minX + maxX) / 2 * scale;
    const offsetY = ui.canvas.height / 2 - (minY + maxY) / 2 * scale;


    // center canvas and draw the attractor
    ctx.setTransform(1, 0, 0, 1, offsetX, offsetY);
    for (let i = 1; i < path.length; i++) {
      const drawXPrev = Math.floor(path[i - 1].x * scale);
      const drawYPrev = Math.floor(path[i - 1].y * scale);
      const drawX = Math.floor(path[i].x * scale);
      const drawY = Math.floor(path[i].y * scale);

      if (params.showPoints) {
        ctx.globalAlpha = POINT_ALPHA;
        if (boostAlpha) {
          ctx.globalAlpha += .2
        }
        ctx.strokeStyle = "white";
        ctx.strokeRect(drawX, drawY, 1, 1);
      }

      if (params.showTrails) {
        ctx.beginPath();

        ctx.globalAlpha = LINE_ALPHA;

        let angle = Math.atan2(drawX - drawXPrev, drawY - drawYPrev); // get angle between points in radians
        angle *= 180 / Math.PI; // convert radians to degrees
        if (angle < 0) angle = 360 + angle; // ensure degress in range 0-360

        // select the color based on the angle
        const stride = 360.0 / colors.length;
        ctx.strokeStyle = colors[Math.floor(angle / stride)]

        ctx.moveTo(drawXPrev, drawYPrev);
        ctx.lineTo(drawX, drawY);
        ctx.stroke();
        ctx.closePath();
      }

    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.globalAlpha = 1;
    ctx.fillStyle = "white";
    ctx.font = "20px monospace";
    ctx.fillText("Attractors", 10, 30);
    ctx.font = "14px monospace";
    let yo = 60;
    for (const line of Attractors[params.attractor].fn.toString().split('\n')) {
      ctx.fillText(line, 10, yo);
      yo += 20;
    }

  };

  function randomizeParams() {
    const max = 5;
    const min = -max;
    const a = parseFloat((Math.random() * (max - min) + min).toFixed(3));
    const b = parseFloat((Math.random() * (max - min) + min).toFixed(3));
    const c = parseFloat((Math.random() * (max - min) + min).toFixed(3));
    const d = parseFloat((Math.random() * (max - min) + min).toFixed(3));
    setUI({ a, b, c, d });
  }

  function attractorChanged() {
    let ui = readFromUI();
    let paramInputs = document.getElementsByName("paramInput");
    for (let i = 0; i < paramInputs.length; i++) {
      paramInputs[i].style.display = "none";
      if (i < Attractors[ui.attractor].numParams) {
        paramInputs[i].style.display = "";
      }
    }
  }

  function initUI() {
    const attractorSelect = document.getElementById("attractorSelect");
    const aSlider = document.getElementById("aSlider");
    const bSlider = document.getElementById("bSlider");
    const cSlider = document.getElementById("cSlider");
    const dSlider = document.getElementById("dSlider");
    const showPointsOption = document.getElementById("showPointsOption");
    const showTrailsOption = document.getElementById("showTrailsOption");
    const showBothOption = document.getElementById("showBothOption");
    const randomizeButton = document.getElementById("randomizeButton");

    attractorSelect.setAttribute("size", Attractors.length);
    for (let i = 0; i < Attractors.length; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.innerText = Attractors[i].name;
      attractorSelect.appendChild(opt);
    }
    attractorSelect.onchange = () => { attractorChanged(); randomizeColors(); runAttractor(); };

    aSlider.oninput = () => { aValue.innerText = aSlider.value; runAttractor(); }
    bSlider.oninput = () => { bValue.innerText = bSlider.value; runAttractor(); }
    cSlider.oninput = () => { cValue.innerText = cSlider.value; runAttractor(); }
    dSlider.oninput = () => { dValue.innerText = dSlider.value; runAttractor(); }
    showPointsOption.onchange = runAttractor;
    showTrailsOption.onchange = runAttractor;
    showBothOption.onchange = runAttractor;
    randomizeButton.onclick = () => { randomizeParams(); randomizeColors(); runAttractor(); }

    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("myCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;


    window.onresize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      runAttractor();
    }

    return {
      attractorSelect,
      aSlider,
      bSlider,
      cSlider,
      dSlider,
      showPointsOption,
      showTrailsOption,
      showBothOption,
      canvas,
    };
  }

  function readFromUI() {
    return {
      a: parseFloat(ui.aSlider.value),
      b: parseFloat(ui.bSlider.value),
      c: parseFloat(ui.cSlider.value),
      d: parseFloat(ui.dSlider.value),
      showTrails: ui.showTrailsOption.checked || ui.showBothOption.checked,
      showPoints: ui.showPointsOption.checked || ui.showBothOption.checked,
      attractor: ui.attractorSelect.value
    };
  }

  function setUI(params) {
    ui.aSlider.value = params.a ?? ui.aSlider.value;
    ui.bSlider.value = params.b ?? ui.bSlider.value;
    ui.cSlider.value = params.c ?? ui.cSlider.value;
    ui.dSlider.value = params.d ?? ui.dSlider.value;

    aValue.innerText = ui.aSlider.value;
    bValue.innerText = ui.bSlider.value;
    cValue.innerText = ui.cSlider.value;
    dValue.innerText = ui.dSlider.value;

    if (params.showPoints && params.showTrails) {
      ui.showBothOption.checked = true;
    } else {
      ui.showPointsOption.checked = params.showPoints ?? ui.showPointsOption.checked;
      ui.showTrailsOption.checked = params.showTrails ?? ui.showTrailsOption.checked;
    }

    ui.attractorSelect.value = params.attractor ?? ui.attractorSelect.value;
    attractorChanged();
  }

})();
