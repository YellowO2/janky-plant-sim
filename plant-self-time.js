const GrowthTemplates = {
  tree: {
    maxDepth: 6,
    branchProbability: (depth) => 0.1 - 0.035 * depth, // Decreases with depth
    transitionColors: { start: "#6b8e23", end: "#6b3323" },
    stiffnessRange: { start: 0.05, end: 0.4 },
  },
  shrub: {
    maxDepth: 3,
    branchProbability: (depth) => 0.6 - 0.2 * depth, // Dense branching
    transitionColors: { start: "#556b2f", end: "#8b4513" },
    stiffnessRange: { start: 0.5, end: 0.8 },
  },
  custom: {
    maxDepth: 4,
    branchProbability: (depth) => 0.2 - 0.05 * depth, // Decreases with depth
    transitionColors: { start: "#6b8e23", end: "#6b3323" },
    stiffnessRange: { start: 0.6, end: 0.8 },
  },
};

const timeControl = 10;
const WIDTH = 5;
const HEIGHT = 2;
const growIncrement = 1;
const maxIterations = 25;
const constrainVisibility = false;
const transitionPeriod = 10;
const BASE = { x: 600, y: 600 };

let allStems = [];

class StemCell {
  constructor(
    width = WIDTH,
    height = HEIGHT,
    parent = null,
    growthAngle = 0, // Angle of growth in radians, 0 = vertical
    branchDepth = 0,
    template = GrowthTemplates.tree,
    generation = 0
  ) {
    this.age = 0;
    this.width = width;
    this.height = height;
    this.parent = parent;
    this.growthAngle = growthAngle; // Angle relative to parent
    this.branchDepth = branchDepth;
    this.template = template;
    this.generation = generation;

    // Calculate initial position
    const currentPosition = parent ? parent.body.position : { x: 0, y: 0 };
    const offsetX = Math.sin(this.growthAngle) * (HEIGHT + 4);
    const offsetY = -Math.cos(this.growthAngle) * (HEIGHT + 4);
    const newX = currentPosition.x + offsetX;
    const newY = currentPosition.y + offsetY;

    this.body = Bodies.rectangle(newX, newY, width, height, {
      render: { fillStyle: template.transitionColors.start },
      friction: 0.9,
      frictionAir: 0.5,
      restitution: 0.2,
      collisionFilter: {
        group: growthAngle == -1, // Negative groups do not collide with each other
      },
    });

    World.add(world, this.body);

    allStems.push(this);

    this.constraints = [];
    this.createConstraints();
    this.grow();
  }

  createConstraints() {
    if (!this.parent) return;

    // Remove old constraints if any
    this.constraints.forEach((constraint) => World.remove(world, constraint));
    this.constraints = [];

    const anchorLeft = {
      x: -(20 + this.width * 5) + this.body.position.x,
      y: BASE.y,
    }; // Example fixed point in the world
    const anchorRight = {
      x: 20 + this.width * 5 + this.body.position.x,
      y: BASE.y,
    }; // Another fixed point

    // Center constraint (still connected to the parent)
    const mainConstraint = Matter.Constraint.create({
      bodyA: this.parent.body,
      bodyB: this.body,
      pointA: { x: 0, y: 0 },
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      damping: 0.3,
      render: { visible: constrainVisibility },
    });

    // Left constraint anchored to a world point
    const leftConstraint = Matter.Constraint.create({
      pointA: anchorLeft, // Fixed point in the world
      bodyB: this.body,
      pointB: { x: -this.width, y: 0 },
      stiffness: this.template.stiffnessRange.start,
      damping: 0.2,
      render: { visible: constrainVisibility },
    });

    // Right constraint anchored to a world point
    const rightConstraint = Matter.Constraint.create({
      pointA: anchorRight, // Fixed point in the world
      bodyB: this.body,
      pointB: { x: this.width, y: 0 },
      stiffness: this.template.stiffnessRange.start,
      damping: 0.2,
      render: { visible: constrainVisibility },
    });

    this.constraints = [mainConstraint, leftConstraint, rightConstraint];
    World.add(world, this.constraints);
  }

  grow() {
    const intermediateIterations = maxIterations - transitionPeriod;
    const intervalId = setInterval(() => {
      if (this.age >= maxIterations) {
        clearInterval(intervalId);
        this.finalHarden();
        return;
      }

      this.age += 1;
      this.width += growIncrement;

      Matter.Body.scale(this.body, 1 + growIncrement / this.width, 1);

      if (this.age >= intermediateIterations) {
        this.updateIntermediateState();
      }

      if (this.age % 4 === 0) {
        this.createConstraints();
      }
    }, 2500 + (this.branchDepth * 100 + this.generation * 10) / timeControl);

    setTimeout(
      () => this.cellDivision(),
      (2500 + this.generation * 100 + this.branchDepth * 1000) / timeControl
    );
  }

  cellDivision() {
    if (this.branchDepth < this.template.maxDepth) {
      const branchChance =
        this.template.branchProbability(this.branchDepth) -
        1 / (this.generation ^ 2);
      if (Math.random() < branchChance) {
        const angleOffset =
          (Math.PI / 4 + this.generation / 50) * (Math.random() - 0.5); // Random small angle offset
        const newGrowthAngle = this.growthAngle + angleOffset;

        new StemCell(
          WIDTH,
          HEIGHT,
          this,
          newGrowthAngle,
          this.branchDepth + 1,
          this.template,
          this.generation + 1
        );
      }
    }

    // Default continuation of the current branch
    new StemCell(
      WIDTH,
      HEIGHT,
      this,
      this.growthAngle,
      this.branchDepth,
      this.template,
      this.generation + 1
    );
  }

  updateIntermediateState() {
    const transitionRatio =
      (this.age - (maxIterations - transitionPeriod)) / transitionPeriod;
    const startColor = this.hexToRgb(this.template.transitionColors.start);
    const endColor = this.hexToRgb(this.template.transitionColors.end);

    const currentColor = {
      r: Math.round(
        startColor.r + (endColor.r - startColor.r) * transitionRatio
      ),
      g: Math.round(
        startColor.g + (endColor.g - startColor.g) * transitionRatio
      ),
      b: Math.round(
        startColor.b + (endColor.b - startColor.b) * transitionRatio
      ),
    };

    this.body.render.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;

    const stiffnessRange = this.template.stiffnessRange;
    const newStiffness =
      stiffnessRange.start +
      (stiffnessRange.end - stiffnessRange.start) * transitionRatio;
    this.updateConstraintsStiffness(newStiffness);
  }

  finalHarden() {
    Body.setStatic(this.body, true);
    this.body.render.fillStyle = this.template.transitionColors.end;
    this.updateConstraintsStiffness(this.template.stiffnessRange.end);
  }

  updateConstraintsStiffness(newStiffness) {
    this.constraints.forEach((constraint) => {
      constraint.stiffness = newStiffness;
    });
  }

  hexToRgb(hex) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }
}
