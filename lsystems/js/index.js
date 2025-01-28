(function init() {
  let axiom, rules, generations, currentGeneration, angle, lengthScale;
  let animationHandle;
  const presets = [
    { axiom: "F+F+F+F", rules: ["F -> FF+F-F+F+FF"], angle: 90, generation: 3 },
    { axiom: "X", rules: ["F -> FF", "X -> F[+X]F[-X]+X"], angle: 20, generation: 7 },
    { axiom: "-YF", rules: ["X -> XFX-YF-YF+FX+FX-YF-YFFX+YF+FXFXYF-FX+YF+FXFX+YF-FXYF-YF-FX+FX+YFYF-", "Y -> +FXFX-YF-YF+FX+FXYF+FX-YFYF-FX-YF+FXYFYF-FX-YFFX+FX+YF-YF-FX+FX+YFY"], angle: 90, generation: 2 },
    { axiom: "F", rules: ["F -> FF+[+F-F-F]-[-F+F+F]"], angle: 22.5, generation: 4 },
    { axiom: "F+F+F", rules: ["F -> F-F+F"], angle: 120, generation: 5 },
    { axiom: "FX", rules: ["X -> >[-FX]+FX"], angle: 40, generation: 10, lengthScale: 1.7 },
  ]

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    throw new Error("Unable to find canvas element.");
  }

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to get rendering context for canvas.");
  }

  canvas.width = window.innerWidth - controls.offsetWidth * 2;
  canvas.height = window.innerHeight;
  window.onresize = () => {
    canvas.width = window.innerWidth - controls.offsetWidth * 2;
    canvas.height = window.innerHeight;
    update();
  }

  const axiomInput = document.getElementById("axiomInput");
  const ruleInput = document.getElementById("ruleInput");
  const ruleInput2 = document.getElementById("ruleInput2");
  const generationValue = document.getElementById("generationValue");
  const generationSlider = document.getElementById("generationSlider");
  const angleValue = document.getElementById("angleValue");
  const angleInput = document.getElementById("angleInput");
  const angleSlider = document.getElementById("angleSlider");
  const lengthScaleControls = document.getElementById("lengthScaleControls");
  const lengthScaleValue = document.getElementById("lengthScaleValue");
  const lengthScaleSlider = document.getElementById("lengthScaleSlider");
  const generationText = document.getElementById("generationText");
  const presetSelect = document.getElementById("presetSelect");

  axiomInput.oninput = update;
  ruleInput.oninput = update;
  ruleInput2.oninput = update;
  generationSlider.oninput = update;
  angleInput.oninput = update;
  angleSlider.oninput = () => { angleInput.value = angleSlider.value; update(); };
  lengthScaleSlider.oninput = update;

  presetSelect.setAttribute("size", presets.length);
  for (let i = 0; i < presets.length; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.innerText = `Preset ${i + 1}`;
    presetSelect.appendChild(opt);
  }
  presetSelect.oninput = () => {
    const preset = presets[presetSelect.value];
    axiomInput.value = preset.axiom;
    ruleInput.value = preset.rules[0];
    ruleInput2.value = preset.rules[1] ?? "";
    generationSlider.value = preset.generation;
    angleInput.value = preset.angle;
    lengthScaleSlider.value = preset.lengthScale ?? lengthScaleSlider.value;
    update();
  };

  presetSelect.value = 1;
  presetSelect.oninput();

  function update() {

    axiom = axiomInput.value;
    rules = [ruleInput.value, ruleInput2.value];
    generations = [axiom];

    currentGeneration = parseInt(generationSlider.value);
    generationValue.innerText = currentGeneration;


    angle = parseFloat(angleInput.value);
    angleValue.innerText = angle;
    angleSlider.value = angle;

    lengthScaleControls.style.display = 'none';
    if (
      ['<', '>'].some(x => axiomInput.value.indexOf(x) != -1)
      || ['<', '>'].some(x => (ruleInput.value.split('->')[1]?.indexOf(x) ?? -1) != -1)
      || ['<', '>'].some(x => (ruleInput2.value.split('->')[1]?.indexOf(x) ?? -1) != -1)
    ) {
      lengthScaleControls.style.display = 'block';
    }
    lengthScale = parseFloat(lengthScaleSlider.value);
    lengthScaleValue.innerText = lengthScale;

    generate();
    renderLines();

    generationText.innerText = generations[currentGeneration];

    performance.measure('measureProcessRules', 'beginProcessRules', 'endProcessRules');
    performance.measure('measureGenerateLines', 'beginGenerateLines', 'endGenerateLines');
    performance.measure('measureRenderLines', 'beginRenderLines', 'endRenderLines');
    const mrules = performance.getEntriesByName('measureProcessRules').pop().duration;
    const mgenlines = performance.getEntriesByName('measureGenerateLines').pop().duration;
    const mrenderlines = performance.getEntriesByName('measureRenderLines').pop().duration;
    stats.innerHTML = `Performance:<br/>`
      + `&nbsp;&nbsp;rules: ${mrules}ms<br/>`
      + `&nbsp;&nbsp;geometry: ${mgenlines}ms<br/>`
      + `&nbsp;&nbsp;render: ${mrenderlines}ms`
  }

  function generate() {
    const tempGeneration = currentGeneration;
    currentGeneration = 0;
    for (let i = 0; i <= parseInt(tempGeneration); i++) {
      processRules();
    }
    currentGeneration = tempGeneration;
  }

  function processRules() {
    performance.mark('beginProcessRules');

    const currentValue = generations[currentGeneration];

    const nextValue = Array.from(currentValue).flatMap(c => {
      let result;
      for (const r of rules) {
        let [key, replacement] = r.split('->').map(r => r.trim());
        if (c == key) {
          result = replacement;
          break;
        }
      }
      if (result == null) {
        result = c;
      }
      return result;
    }).join('');

    generations.push(nextValue);
    currentGeneration = generations.length - 1;

    performance.mark('endProcessRules');
  }

  function generateLines() {
    performance.mark('beginGenerateLines');

    let lines = [];

    let states = [];
    states.push({ x: 0, y: 0, rangle: 0, lineLen: 1 })
    let currentState = 0;

    let minX = 0, maxX = 0, minY = 0, maxY = 0;

    const currentValue = generations[currentGeneration];
    for (const c of currentValue) {
      switch (c) {
        case 'F':
          {
            // move forward and draw 
            const { x, y, rangle, lineLen } = states[currentState];
            let newX = x + lineLen * Math.sin(rangle)
            let newY = y - lineLen * Math.cos(rangle)
            lines.push({
              start: [x, y],
              end: [newX, newY],
              visible: true
            })
            states[currentState].x = newX;
            states[currentState].y = newY;

            minX = Math.min(minX, newX);
            maxX = Math.max(maxX, newX);
            minY = Math.min(minY, newY);
            maxY = Math.max(maxY, newY);
            continue;
          }
        case 'f':
          {
            // move forward without drawing
            const { x, y, rangle, lineLen } = states[currentState];
            let newX = x + lineLen * Math.sin(rangle)
            let newY = y - lineLen * Math.cos(rangle)
            lines.push({
              start: [x, y],
              end: [newX, newY],
              visible: false
            })
            states[currentState].x = newX;
            states[currentState].y = newY;

            minX = Math.min(minX, newX);
            maxX = Math.max(maxX, newX);
            minY = Math.min(minY, newY);
            maxY = Math.max(maxY, newY);
            continue;
          }
        case '+':
          // rotate -angle
          states[currentState].rangle += angle * Math.PI / 180;
          continue;
        case '-':
          // rotate +angle
          states[currentState].rangle += -angle * Math.PI / 180;
          continue;
        case '|':
          // reverse direction (turn 180 deg)
          states[currentState].rangle += 180 * Math.PI / 180;
          continue;
        case '[':
          // push state onto stack
          let state = JSON.stringify(states[currentState])
          states.push(JSON.parse(state));
          currentState++;
          continue;
        case ']':
          // pop state from stack
          states.pop();
          currentState--;
          continue;
        case '>':
          states[currentState].lineLen /= lengthScale;
          continue;
        case '<':
          states[currentState].lineLen *= lengthScale;
          continue;
        default:
          continue;
      }
    }

    performance.mark('endGenerateLines');

    return { minX, maxX, minY, maxY, lines }
  }

  function renderLines() {
    if (animationHandle) {
      cancelAnimationFrame(animationHandle);
    }

    performance.mark('beginRenderLines');

    const { minX, maxX, minY, maxY, lines } = generateLines();

    // determine scale of the scene so that it can be properly centered and drawn in the canvas
    const scaleX = canvas.width / (maxX - minX + 1e-20);
    const scaleY = canvas.height / (maxY - minY + 1e-20);
    const scale = Math.min(scaleX, scaleY) * 0.9;
    const offsetX = canvas.width / 2 - (minX + maxX) / 2 * scale;
    const offsetY = canvas.height / 2 - (minY + maxY) / 2 * scale;


    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 0.3;
    context.strokeStyle = "white";

    let frame = 0;
    let batch = lines.length < 10000 ? 10000 : Math.min(lines.length / 50, 50000);
    function drawBatch() {
      if (frame >= lines.length) {
        return;
      }

      context.save();
      context.beginPath();
      for (let i = 0; i < batch; i++) {
        if (frame >= lines.length) {
          break;
        }

        let l = lines[frame];
        context.setTransform(1, 0, 0, 1, offsetX, offsetY);
        context.moveTo(l.start[0] * scale, l.start[1] * scale);
        context.lineTo(l.end[0] * scale, l.end[1] * scale);

        frame++;
      }
      context.stroke();
      context.restore();
      animationHandle = requestAnimationFrame(drawBatch);
    }
    animationHandle = requestAnimationFrame(drawBatch);

    performance.mark('endRenderLines');
  }

})();
