import { GameOfLife } from "./gameOfLife.js";

const MAX_FPS = 30;
const CELL_SIZE = 10;

(function init() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("gameOfLifeCanvas");
  if (!canvas) {
    throw new Error("Unable to find canvas element.");
  }

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to get rendering context for canvas.");
  }

  canvas.width = window.innerWidth - controls.offsetWidth;;
  canvas.height = window.innerHeight;

  const rows = Math.floor(canvas.height / CELL_SIZE);
  const cols = Math.floor(canvas.width / CELL_SIZE);

  const game = new GameOfLife(rows, cols, context);

  window.onresize = () => {
    canvas.width = window.innerWidth - controls.offsetWidth;;
    canvas.height = window.innerHeight;
    const rows = Math.floor(canvas.height / CELL_SIZE);
    const cols = Math.floor(canvas.width / CELL_SIZE);
    game.setDimensions(rows, cols)
  }

  cellSizeValue.innerText = cellSizeSlider.value;
  cellSizeSlider.oninput = () => {
    cellSizeValue.innerText = cellSizeSlider.value;
    const rows = Math.floor(canvas.height / cellSizeSlider.value);
    const cols = Math.floor(canvas.width / cellSizeSlider.value);
    game.setDimensions(rows, cols)
  }

  let currentSpeed, currentColor, currentStyle;
  currentSpeed = MAX_FPS * parseFloat(speedSlider.value);
  currentColor = colorInput.value;
  currentStyle = "circle";

  speedValue.innerText = currentSpeed;
  speedSlider.oninput = () => {
    const value = MAX_FPS * parseFloat(speedSlider.value);
    speedValue.innerText = value;
    currentSpeed = value;
  };
  colorInput.oninput = () => {
    currentColor = colorInput.value;
  };

  (function mainLoop() {
    let lastFrameTime;

    /** @param {DOMHighResTimeStamp} now */
    function animate(now) {
      requestAnimationFrame(animate);

      const frameDuration = 1000 / currentSpeed;

      lastFrameTime = lastFrameTime ?? now;
      const deltaTime = now - lastFrameTime;
      if (deltaTime < frameDuration) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      game.update();
      game.draw({ style: currentStyle, color: currentColor });

      lastFrameTime = now;
    }

    animate();
  })();

})();
