// Create overlay canvas for organic rendering
const createOverlayCanvas = () => {
  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.id = "organicRenderer";
  overlayCanvas.style.position = "absolute";
  overlayCanvas.style.zIndex = "100";
  overlayCanvas.style.top = "0";
  overlayCanvas.style.left = "0";
  overlayCanvas.style.pointerEvents = "none"; // Let events pass through to Matter.js

  document.body.appendChild(overlayCanvas);
  return overlayCanvas;
};

class OrganicRenderer {
  constructor() {
    this.canvas = createOverlayCanvas();
    this.ctx = this.canvas.getContext("2d");
    this.setup();
  }

  setup() {
    // Match size with Matter.js canvas
    this.canvas.width = window.innerWidth;
    this.canvas.height = canvasHeight;

    // Start render loop
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw stems first (so they appear behind leaves)
    allStems.forEach((stem) => this.drawStem(stem));

    // Draw leaves on top
    allLeaves.forEach((leaf) => this.drawLeaf(leaf));

    requestAnimationFrame(this.render);
  }

  drawStem(stem) {
    if (!stem.parent) return;

    const start = stem.parent.body.position;
    const end = stem.body.position;

    // Calculate control points for natural curve
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const controlPoint1 = {
      x: start.x + dx * 0.25,
      y: start.y + dy * 0.25,
    };

    const controlPoint2 = {
      x: end.x - dx * 0.25,
      y: end.y - dy * 0.25,
    };

    // Calculate stem thickness based on generation and depth
    const thickness = stem.width;

    // Draw the curved stem
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.bezierCurveTo(
      controlPoint1.x,
      controlPoint1.y,
      controlPoint2.x,
      controlPoint2.y,
      end.x,
      end.y
    );

    this.ctx.strokeStyle = stem.body.render.fillStyle;
    this.ctx.lineWidth = thickness;
    this.ctx.lineCap = "round";
    this.ctx.stroke();
  }

  drawLeaf(leaf) {
    const pos = leaf.body.position;
    const size = 10; // Adjust for visibility

    this.ctx.save();
    this.ctx.translate(pos.x, pos.y);

    // // Set style for petals
    this.ctx.fillStyle = leaf.getColor();

    // Left petal
    this.ctx.beginPath();
    this.ctx.ellipse(
      -size / 4,
      0,
      size / 3,
      size / 2,
      -Math.PI / 4,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Right petal
    this.ctx.beginPath();
    this.ctx.ellipse(
      size / 4,
      0,
      size / 3,
      size / 2,
      Math.PI / 4,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.restore();
  }

  calculateStemThickness(stem) {
    const baseThickness = stem.template.stemRadius * 2;
    const generationFactor = 1 - stem.generation * 0.15;
    const depthFactor = 1 - stem.branchDepth * 0.1;
    return Math.max(baseThickness * generationFactor * depthFactor, 1);
  }
}
