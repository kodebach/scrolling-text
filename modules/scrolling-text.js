import {
  drawText,
  getTextHeight,
  splitText,
} from "https://unpkg.com/canvas-txt?module";

/**
 * @typedef {object} TextSettings
 * @property {string} font font name
 * @property {number} size in pixel
 * @property {number} weight
 * @property {string} fillColor
 * @property {string} strokeColor
 * @property {number} strokeWidth
 * @property {number} lineHeight
 */

/**
 * @type {TextSettings}
 */
export const DEFAULT_TEXT_SETTINGS = {
  font: "Noto Sans",
  size: 72,
  weight: 500,
  fillColor: "white",
  strokeColor: "#666666",
  strokeWidth: 3.14,
  lineHeight: 1.15,
};

/**
 * @typedef {object} Padding
 * @property {number} top in pixel
 * @property {number} bottom in pixel
 * @property {number} left in pixel
 * @property {number} right in pixel
 */

/**
 * @type {Padding}
 */
export const DEFAULT_PADDING = { top: 0, left: 50, right: 50, bottom: 0 };

const DEBUG_DRAW = false;

export class ScrollingText {
  #ctx;
  #text;
  /**
   * @type {string[][]}
   */
  #columns;
  /**
   * @type {number}
   */
  #columnLength;

  settings;
  padding;
  scrollSpeed;
  repeatSpacing;

  #renderActive = false;
  #zero;

  #columnCount;
  columnSpacing;

  #autoSizeFont;
  #wordWrap;

  /**
   * @type {number}
   */
  #fontSize;

  #resetCanvas() {
    this.#ctx.canvas.width = window.visualViewport.width;
    this.#ctx.canvas.height = window.visualViewport.height;

    this.#zero = document.timeline.currentTime;
  }

  get #font() {
    return `${this.settings.weight} ${this.#fontSize}px ${this.settings.font}`;
  }

  #splitText() {
    this.#resetCanvas();
    /**
     * @type {string[]}
     */
    let allLines;
    if (this.#autoSizeFont || !this.#wordWrap) {
      allLines = this.#text.split(/\r?\n/);
    } else {
      allLines = splitText({
        ctx: this.#ctx,
        text: this.#text,
        width: this.#ctx.canvas.width - this.padding.left - this.padding.right,
        justify: false,
      });
    }
    allLines = allLines.map((line) => line.trim());
    allLines =
      allLines.length > 0 && allLines[allLines.length - 1].length == 0
        ? allLines.slice(0, allLines.length - 1)
        : allLines;

    if (this.#autoSizeFont) {
      const width =
        this.#ctx.canvas.width - this.padding.left - this.padding.right;
      const columnWidth =
        (width - this.columnSpacing * (this.#columnCount - 1)) /
        this.#columnCount;

      // assume width scales linearly with font size
      this.#ctx.font = `${this.settings.weight} ${this.settings.size}px ${this.settings.font}`;
      this.#ctx.textAlign = "center";
      let [_, largestLine] = allLines.reduce(
        (largest, line) => {
          const [width, _] = largest;
          const metrics = this.#ctx.measureText(line);
          return width >= metrics.width ? largest : [metrics.width, line];
        },
        [0, ""]
      );

      let minFontSize = 1;
      let maxFontSize = this.settings.size;
      let fontSize = Math.ceil((minFontSize + maxFontSize) / 2);

      while (true) {
        this.#ctx.font = `${this.settings.weight} ${fontSize}px ${this.settings.font}`;
        this.#ctx.textAlign = "center";
        const metrics = this.#ctx.measureText(largestLine);
        if (metrics.width > columnWidth) {
          maxFontSize = fontSize;
          fontSize = Math.ceil((minFontSize + maxFontSize) / 2);
        } else if (metrics.width < columnWidth) {
          minFontSize = fontSize;
          fontSize = Math.ceil((minFontSize + maxFontSize) / 2);
        }

        if (minFontSize >= maxFontSize - 1) {
          fontSize = Math.min(
            this.settings.size,
            Math.ceil((minFontSize + maxFontSize) / 2)
          );
          break;
        }
      }
      this.#fontSize = fontSize;
    } else {
      this.#fontSize = this.settings.size;
    }

    const chunkSize = Math.floor(allLines.length / this.#columnCount);
    const columns = Array.from({ length: this.#columnCount }).map((_) =>
      allLines.splice(0, chunkSize)
    );

    if (allLines.length > 0) {
      for (let l = 0; l < this.#columnCount; l++) {
        if (l < allLines.length) {
          columns[l].push(allLines[l]);
        } else {
          columns[l].push("");
        }
      }
    }

    this.#columns = columns;
    this.#columnLength = columns.length === 0 ? 0 : columns[0].length;
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {string} text
   * @param {number} columnCount
   * @param {number} columnSpacing
   * @param {TextSettings} settings
   * @param {Padding} padding
   * @param {number} speed in pixel per second
   * @param {number} repeatSpacing in pixel, vertical space between loops of the text
   */
  constructor(
    canvas,
    text,
    columnCount,
    columnSpacing,
    settings,
    padding,
    speed,
    repeatSpacing
  ) {
    this.#ctx = canvas.getContext("2d");

    this.#text = text;

    this.#columnCount = columnCount;
    this.columnSpacing = columnSpacing;

    this.settings = settings;
    this.padding = padding;
    this.scrollSpeed = speed;
    this.repeatSpacing = repeatSpacing;

    this.#autoSizeFont = false;
    this.#wordWrap = false;

    this.#splitText();

    const observer = new ResizeObserver(() => {
      this.text = this.#text;
    });
    observer.observe(canvas);
  }

  /**
   * @type {number}
   */
  get columnCount() {
    return this.#columnCount;
  }

  set columnCount(columnCount) {
    this.#columnCount = columnCount;
    this.text = this.#text;
  }

  /**
   * @type {string}
   */
  get text() {
    return this.#text;
  }

  set text(text) {
    this.#text = text;
    this.#splitText();
    this.#resetCanvas();
  }

  get autoSizeFont() {
    return this.#autoSizeFont;
  }

  set autoSizeFont(autoSizeFont) {
    this.#autoSizeFont = autoSizeFont;
    this.#splitText();
    this.#resetCanvas();
  }

  get wordWrap() {
    return this.#wordWrap;
  }

  set wordWrap(wordWrap) {
    this.#wordWrap = wordWrap;
  }

  /**
   * @type {boolean}
   */
  get renderActive() {
    return this.renderActive;
  }

  set renderActive(renderActive) {
    this.#renderActive = renderActive;
    this.#resetCanvas();
    requestAnimationFrame((t) => this.#animate(t));
  }

  #animate(timestamp) {
    this.#ctx.clearRect(0, 0, this.#ctx.canvas.width, this.#ctx.canvas.height);

    if (!this.#renderActive) {
      return;
    }

    this.#ctx.font = this.#font;
    this.#ctx.textAlign = "center";

    const charHeight =
      getTextHeight({ ctx: this.#ctx, text: "M", style: this.#ctx.font }) *
      this.settings.lineHeight;
    const columnHeight = charHeight * this.#columnLength + this.repeatSpacing;

    const width =
      this.#ctx.canvas.width - this.padding.left - this.padding.right;
    const height =
      this.#ctx.canvas.height - this.padding.top - this.padding.bottom;

    if (DEBUG_DRAW) {
      this.#ctx.save();
      this.#ctx.fillStyle = "green";
      this.#ctx.fillRect(this.padding.left, this.padding.top, width, height);
      this.#ctx.lineWidth = 2;
      this.#ctx.strokeStyle = "blue";
      this.#ctx.beginPath();
      this.#ctx.moveTo(0, this.padding.top - charHeight);
      this.#ctx.lineTo(this.#ctx.canvas.width, this.padding.top - charHeight);
      this.#ctx.stroke();
      this.#ctx.restore();
    }

    const columnWidth =
      (width - this.columnSpacing * (this.#columnCount - 1)) /
      this.#columnCount;

    const scrollOffset = ((timestamp - this.#zero) * this.scrollSpeed) / 1000;

    const lineOffset = scrollOffset % columnHeight;

    let firstLine;
    let linesToDraw;
    let textY;
    if (lineOffset > charHeight * this.#columnLength) {
      firstLine = 0;
      linesToDraw =
        Math.ceil(height / charHeight) +
        2 +
        Math.ceil(this.repeatSpacing / charHeight);
      textY =
        this.padding.top +
        this.repeatSpacing -
        (lineOffset % charHeight) -
        (Math.floor(lineOffset / charHeight) - this.#columnLength) * charHeight;
    } else {
      firstLine = Math.floor(lineOffset / charHeight);
      linesToDraw = Math.ceil(height / charHeight) + 2;
      textY = this.padding.top - (lineOffset % charHeight);
    }

    for (let c = 0; c < this.#columnCount; c++) {
      const textX =
        this.padding.left +
        columnWidth / 2 +
        columnWidth * c +
        this.columnSpacing * c;

      let columnY = textY;
      let columnX =
        this.padding.left + columnWidth * c + this.columnSpacing * c;

      this.#ctx.save();
      this.#ctx.beginPath();
      this.#ctx.moveTo(columnX, DEBUG_DRAW ? 0 : this.padding.top);
      this.#ctx.lineTo(
        columnX + columnWidth,
        DEBUG_DRAW ? 0 : this.padding.top
      );
      this.#ctx.lineTo(
        columnX + columnWidth,
        DEBUG_DRAW ? this.#ctx.canvas.height : height
      );
      this.#ctx.lineTo(columnX, DEBUG_DRAW ? this.#ctx.canvas.height : height);
      this.#ctx.closePath();
      this.#ctx.clip();

      const column = this.#columns[c];

      if (DEBUG_DRAW) {
        this.#ctx.lineWidth = 2;
        this.#ctx.strokeStyle = "red";
        this.#ctx.strokeRect(
          columnX,
          columnY - repeatSpacing - charHeight * (firstLine + 1),
          columnWidth,
          repeatSpacing
        );
      }

      for (let i = 0; i < linesToDraw; i++) {
        const idx = (firstLine + i) % this.#columnLength;

        this.#ctx.fillStyle = this.settings.fillColor;
        this.#ctx.fillText(column[idx] ?? "", textX, columnY);
        if (this.settings.strokeWidth > 0) {
          this.#ctx.lineWidth =
            (this.settings.strokeWidth * this.#fontSize) / this.settings.size;
          this.#ctx.strokeStyle = this.settings.strokeColor;
          this.#ctx.strokeText(column[idx] ?? "", textX, columnY);
        }
        columnY += charHeight;
        if (idx == this.#columnLength - 1) {
          if (DEBUG_DRAW) {
            this.#ctx.strokeStyle = "red";
            this.#ctx.strokeRect(
              columnX,
              columnY - charHeight,
              columnWidth,
              this.repeatSpacing
            );
          }
          columnY += this.repeatSpacing;
        }
      }
      this.#ctx.restore();
    }

    requestAnimationFrame((t) => this.#animate(t));
  }
}
