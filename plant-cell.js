// plant-cell.js
const GrowthTemplates = {
  tree: {
    maxDepth: 6,
    branchProbability: (generation) => 0.2 - 1.8 / (generation + 1),
    transitionColors: { start: "#6b8e23", end: "#6b3323" },
    stiffnessRange: { start: 0.05, end: 0.4 },
  },
  shrub: {
    maxDepth: 3,
    branchProbability: (depth) => 0.6 - 0.2 * depth,
    transitionColors: { start: "#556b2f", end: "#8b4513" },
    stiffnessRange: { start: 0.5, end: 0.8 },
  },
  custom: {
    maxDepth: 4,
    branchProbability: (depth) => 0.2 - 0.05 * depth,
    transitionColors: { start: "#6b8e23", end: "#6b3323" },
    stiffnessRange: { start: 0.6, end: 0.8 },
  },
};

const SETTINGS = {
  timeControl: 10,
  dimensions: { width: 5, height: 2 },
  growIncrement: 0.5,
  maxIterations: 40,
  transitionRatio: 0.5,
  BASE_POSITION: { x: 600, y: 600 },
  constrainVisibility: false,
  cellSpacing: 8,
};

let allStems = [];
let allLeaves = [];

class StemCell {
  constructor(
    width = SETTINGS.dimensions.width,
    height = SETTINGS.dimensions.height,
    parent = null,
    growthAngle = 0,
    branchDepth = 0,
    template = GrowthTemplates.tree,
    generation = 0
  ) {
    this.initializeProperties(
      width,
      height,
      parent,
      growthAngle,
      branchDepth,
      template,
      generation
    );
    this.createBody();
    this.createConstraints();
    this.startGrowth();
  }

  initializeProperties(
    width,
    height,
    parent,
    growthAngle,
    branchDepth,
    template,
    generation
  ) {
    this.age = 0;
    this.width = width;
    this.height = height;
    this.parent = parent;
    this.growthAngle = growthAngle;
    this.branchDepth = branchDepth;
    this.template = template;
    this.generation = generation;
    this.constraints = [];
  }

  createBody() {
    const position = this.calculatePosition();
    this.body = Bodies.rectangle(
      position.x,
      position.y,
      this.width,
      this.height,
      {
        render: { fillStyle: this.template.transitionColors.start },
        friction: 0.9,
        frictionAir: 0.5,
        restitution: 0.2,
        collisionFilter: { group: this.growthAngle === -1 },
      }
    );
    World.add(world, this.body);
    allStems.push(this);
  }

  calculatePosition() {
    const parentPos = this.parent
      ? this.parent.body.position
      : SETTINGS.BASE_POSITION;
    return {
      x: parentPos.x + Math.sin(this.growthAngle) * SETTINGS.cellSpacing,
      y: parentPos.y - Math.cos(this.growthAngle) * SETTINGS.cellSpacing,
    };
  }

  createConstraints() {
    if (!this.parent) return;

    this.constraints.forEach((constraint) => {
      World.remove(world, constraint);
    });

    const mainConstraint = this.createMainConstraint();
    const [leftConstraint, rightConstraint] = this.createAnchorConstraints();

    this.constraints = [mainConstraint, leftConstraint, rightConstraint];
    World.add(world, this.constraints);
  }

  createMainConstraint() {
    return Matter.Constraint.create({
      bodyA: this.parent.body,
      bodyB: this.body,
      pointA: { x: 0, y: 0 },
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      damping: 0.3,
      // render: { visible: SETTINGS.constrainVisibility },
    });
  }

  createAnchorConstraints() {
    const leftAnchor = {
      x: this.body.position.x - 20 - this.width * 5,
      y: SETTINGS.BASE_POSITION.y,
    };
    const rightAnchor = {
      x: this.body.position.x + 20 + this.width * 5,
      y: SETTINGS.BASE_POSITION.y,
    };

    const createAnchorConstraint = (anchor, offsetX) =>
      Matter.Constraint.create({
        pointA: anchor,
        bodyB: this.body,
        pointB: { x: offsetX, y: 0 },
        stiffness: this.template.stiffnessRange.start,
        damping: 0.2,
        render: { visible: SETTINGS.constrainVisibility },
      });

    return [
      createAnchorConstraint(leftAnchor, -this.width),
      createAnchorConstraint(rightAnchor, this.width),
    ];
  }

  startGrowth() {
    const interval = setInterval(() => {
      if (this.age >= this.calculateCellMaxIterations()) {
        clearInterval(interval);
        this.finalizeGrowth();
        return;
      }
      this.age++;
      this.expandStem();
      if (this.age % 4 === 0) this.createConstraints();
    }, this.calculateGrowthInterval());

    setTimeout(
      () => this.cellReproduction(),
      this.calculateReproductionDelay()
    );
  }

  expandStem() {
    this.width += SETTINGS.growIncrement;
    Matter.Body.scale(this.body, 1 + SETTINGS.growIncrement / this.width, 1);
    if (
      this.age >=
      this.calculateCellMaxIterations() * SETTINGS.transitionPeriod
    ) {
      this.updateIntermediateState();
    }
  }

  updateIntermediateState() {
    const transitionRatio = this.calculateTransitionRatio();
    this.updateColor(transitionRatio);
    this.updateConstraintsStiffness(transitionRatio);
  }

  calculateCellMaxIterations() {
    return (
      SETTINGS.maxIterations - this.generation * 0.5 - this.branchDepth * 5
    );
  }

  calculateTransitionRatio() {
    return SETTINGS.transitionRatio;
  }

  updateColor(transitionRatio) {
    const { start, end } = this.template.transitionColors;
    const startRgb = this.hexToRgb(start);
    const endRgb = this.hexToRgb(end);
    this.body.render.fillStyle = `rgb(${this.interpolateColor(
      startRgb,
      endRgb,
      transitionRatio
    )})`;
  }

  interpolateColor(start, end, ratio) {
    return {
      r: Math.round(start.r + (end.r - start.r) * ratio),
      g: Math.round(start.g + (end.g - start.g) * ratio),
      b: Math.round(start.b + (end.b - start.b) * ratio),
    };
  }

  updateConstraintsStiffness(transitionRatio) {
    const { start, end } = this.template.stiffnessRange;
    const stiffness = start + (end - start) * transitionRatio;
    this.constraints.forEach((constraint) => {
      constraint.stiffness = stiffness;
    });
  }

  finalizeGrowth() {
    Matter.Body.setStatic(this.body, true);
    this.body.render.fillStyle = this.template.transitionColors.end;
    this.updateConstraintsStiffness(1);
  }

  cellReproduction() {
    if (this.generation == 5) {
      new LeaveCell(this);
    } else if (
      this.branchDepth < this.template.maxDepth &&
      Math.random() < this.branchProbability()
    ) {
      const angleOffset = this.calculateBranchAngleOffset();
      new StemCell(
        SETTINGS.dimensions.width,
        SETTINGS.dimensions.height,
        this,
        this.growthAngle + angleOffset,
        this.branchDepth + 1,
        this.template,
        this.generation + 1
      );
    }
    console.log("this called after leave");
    new StemCell(
      SETTINGS.dimensions.width,
      SETTINGS.dimensions.height,
      this,
      this.growthAngle,
      this.branchDepth,
      this.template,
      this.generation + 1
    );
  }

  branchProbability() {
    return this.template.branchProbability(this.generation);
  }

  calculateBranchAngleOffset() {
    return (Math.PI / 4 + this.generation / 50) * (Math.random() - 0.5);
  }

  calculateGrowthInterval() {
    return (
      (3000 +
        (this.branchDepth * this.generation * 500 + this.generation * 10)) /
      SETTINGS.timeControl
    );
  }

  leafProbability() {
    //TODO
    return 1;
  }

  calculateReproductionDelay() {
    return (
      (2500 + this.generation * 20 + this.branchDepth * this.generation * 500) /
      SETTINGS.timeControl
    );
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

class LeaveCell {
  constructor(parent) {
    console.log("this called");
    this.parent = parent;
    const position = parent.calculatePosition();
    this.constraints = [];
    this.width = 5;

    console.log("this called 2");

    this.body = Bodies.circle(position.x + 8, position.y, 5, {
      render: { fillStyle: "#ff0000" },
      friction: 0.9,
      frictionAir: 0.5,
      restitution: 0.2,
      collisionFilter: { group: parent.growthAngle === -1 },
    });

    World.add(world, this.body);
    this.createConstraints();

    allLeaves.push(this);
    console.log("this called 3");
  }

  createConstraints() {
    if (!this.parent) return;

    this.constraints.forEach((constraint) => {
      World.remove(world, constraint);
    });

    const mainConstraint = this.createMainConstraint();
    const [leftConstraint, rightConstraint] = this.createAnchorConstraints();

    this.constraints = [mainConstraint, leftConstraint, rightConstraint];
    World.add(world, this.constraints);
  }

  createMainConstraint() {
    return Matter.Constraint.create({
      bodyA: this.parent.body,
      bodyB: this.body,
      pointA: { x: 0, y: 0 },
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      damping: 0.3,
      render: { visible: SETTINGS.constrainVisibility },
    });
  }

  createAnchorConstraints() {
    const leftAnchor = {
      x: this.body.position.x - 20 - this.width * 5,
      y: SETTINGS.BASE_POSITION.y,
    };
    const rightAnchor = {
      x: this.body.position.x + 20 + this.width * 5,
      y: SETTINGS.BASE_POSITION.y,
    };

    const createAnchorConstraint = (anchor, offsetX) =>
      Matter.Constraint.create({
        pointA: anchor,
        bodyB: this.body,
        pointB: { x: offsetX, y: 0 },
        stiffness: 0.8,
        damping: 0.2,
        render: { visible: SETTINGS.constrainVisibility },
      });

    return [
      createAnchorConstraint(leftAnchor, -this.width),
      createAnchorConstraint(rightAnchor, this.width),
    ];
  }
}
