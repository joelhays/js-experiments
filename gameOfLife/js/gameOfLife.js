export class GameOfLife {
  #rows;
  #columns;
  #cells;
  #context;

  /**
   * @constructor
   * @param {number} rows
   * @param {number} columns
   * @param {CanvasRenderingContext2D} context
   */
  constructor(rows, columns, context) {
    this.#cells = [];
    this.#rows = rows;
    this.#columns = columns;
    this.#context = context;
    this.#generate();
  }

  #generate() {
    for (let y = 0; y < this.#rows; y++) {
      for (let x = 0; x < this.#columns; x++) {
        const cellWidth = this.#context.canvas.width / this.#columns;
        const cellHeight = this.#context.canvas.height / this.#rows;
        const xOffset = x * cellWidth;
        const yOffset = y * cellHeight;
        const centerX = xOffset + cellWidth / 2.0;
        const centerY = yOffset + cellHeight / 2.0;

        this.#cells.push(Object.freeze({
          center: {
            x: centerX,
            y: centerY,
          },
          isAlive: Math.random() * 100 < 50,
          neighbors: 0
        }));
      }
    }
  }

  /**
  * @param {number} index
  */
  #getNeighbors(index) {
    const atRightBound = (index + 1) % this.#columns === 0;
    const atLeftBound = index % this.#columns === 0;

    const tl = atLeftBound ? undefined : this.#cells[index - this.#columns - 1];
    const t = this.#cells[index - this.#columns];
    const tr = atRightBound ? undefined : this.#cells[index - this.#columns + 1];
    const r = atRightBound ? undefined : this.#cells[index + 1];
    const br = atRightBound ? undefined : this.#cells[index + this.#columns + 1];
    const b = this.#cells[index + this.#columns];
    const bl = atLeftBound ? undefined : this.#cells[index + this.#columns - 1];
    const l = atLeftBound ? undefined : this.#cells[index - 1];

    return [tl, t, tr, r, br, b, bl, l];
  }

  /**
  * @param {number} rows
  * @param {number} columns
  */
  setDimensions(rows, columns) {
    this.#cells = [];
    this.#rows = rows;
    this.#columns = columns;
    this.#generate();
  }

  /**
  * @param {number} deltaTime
  */
  update() {
    this.#cells = this.#cells.map((cell, index) => {
      const neighbors = this.#getNeighbors(index).filter(n => n?.isAlive).length;

      let isAlive = cell.isAlive;

      if (cell.isAlive && (neighbors < 2)) {
        // Any live cell with fewer than two live neighbors dies, as if by underpopulation.
        isAlive = false;
      }
      if (cell.isAlive && (neighbors === 2 || neighbors === 3)) {
        // Any live cell with two or three live neighbors lives on to the next generation.
        isAlive = true;
      }
      if (cell.isAlive && (neighbors > 3)) {
        // Any live cell with more than three live neighbors dies, as if by overpopulation.
        isAlive = false;
      }
      if (!cell.isAlive && (neighbors === 3)) {
        // Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
        isAlive = true;
      }

      return Object.freeze({
        center: {
          x: cell.center.x,
          y: cell.center.y,
        },
        isAlive,
        neighbors
      });
    });
  }

  /**
  * @param {CanvasRenderingContext2D} context
  */
  draw({ style = "circle", color = "#0e8" } = {}) {
    const cellWidth = this.#context.canvas.width / this.#columns;
    const cellHeight = this.#context.canvas.height / this.#rows;

    const radius = Math.min(cellWidth, cellHeight) / 2.0;
    const twoPI = 2 * Math.PI;

    let currentCol = 0;
    let currentRow = 0;
    for (let i = 0; i < this.#cells.length; i++) {
      const cell = this.#cells[i];

      if (currentCol + 1 > this.#columns) {
        currentRow++;
        currentCol = 0;
      }

      const xOffset = currentCol * cellWidth;
      const yOffset = currentRow * cellHeight;

      this.#context.fillStyle = "#000";
      if (cell.isAlive) {
        this.#context.fillStyle = color;
      }

      if (style === "circle") {
        this.#context.beginPath();
        this.#context.arc(cell.center.x, cell.center.y, radius, 0, twoPI);
        this.#context.fill();
      }

      if (style === "square") {
        this.#context.fillRect(xOffset, yOffset, cellWidth, cellHeight);
        this.#context.lineWidth = 2;
        this.#context.strokeStyle = "#000";
        this.#context.strokeRect(xOffset, yOffset, cellWidth, cellHeight);
      }

      currentCol++;
    }
  }
}
