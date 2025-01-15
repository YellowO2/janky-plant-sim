// plant-cell.js

const SIMULATION_SETTINGS = {
  timeControl: 10,
  BASE_POSITION: {
    x: window.innerWidth / 2,
    y: window.innerHeight - window.innerHeight / 5,
  },
  cellSpacing: 10,
};

const PLANT_PARAMETERS = {
  dimensions: { width: 1, height: 2 },
  growIncrement: 0.5,
  maxIterations: 80,
  branchProbabilityAdjustment: 0.05,
  templates: {
    tree: {
      maxDepth: 4,
      branchProbability: (generation) => 0.5 - 5 / (generation + 1),
      transitionColors: { start: "#66ba5b", end: "#4c4f46" },
      stiffnessRange: { start: 0.2, end: 0.8 },
    },
    custom: {
      maxDepth: 4,
      branchProbability: (depth) => 0.2 - 0.05 * depth,
      transitionColors: { start: "#6b8e23", end: "#6b3323" },
      stiffnessRange: { start: 0.6, end: 0.8 },
    },
  },
};

const DISPLAY_SETTINGS = {
  constrainVisibility: false,

};


let allStems = [];
let allLeaves = [];

class StemCell {
  constructor({
    width = PLANT_PARAMETERS.dimensions.width,
    height = PLANT_PARAMETERS.dimensions.height,
    parent = null,
    growthAngle = 0,
    branchDepth = 0,
    template = PLANT_PARAMETERS.templates.tree,
    generation = 0,
    segmentLength = 0,
  } = {}) {
    this.initializeProperties({
      width,
      height,
      parent,
      growthAngle,
      branchDepth,
      template,
      generation,
      segmentLength,
    });
    this.createBody();
    this.createConstraints();
    this.startGrowth();
  }

  initializeProperties({
    width,
    height,
    parent,
    growthAngle,
    branchDepth,
    template,
    generation,
    segmentLength,
  }) {
    this.age = 0;
    this.width = width;
    this.height = height;
    this.parent = parent;
    this.growthAngle = growthAngle;
    this.branchDepth = branchDepth;
    this.template = template;
    this.generation = generation;
    this.constraints = [];
    this.segmentLength = segmentLength;
  }

  createBody() {
    const position = this.calculatePosition();
    this.body = Bodies.circle(
      position.x,
      position.y,
      this.width,
      // this.height,
      {
        render: { fillStyle: this.template.transitionColors.start },
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
      : SIMULATION_SETTINGS.BASE_POSITION;
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
      render: { visible: DISPLAY_SETTINGS.constrainVisibility },
    });
  }

  createAnchorConstraints() {
    const leftAnchor = {
      x: this.body.position.x - 20 - this.width * 5,
      y: this.body.position.y + 40,
    };
    const rightAnchor = {
      x: this.body.position.x + 20 + this.width * 5,
      y: this.body.position.y + 40,
    };

    const createAnchorConstraint = (anchor, offsetX) =>
      Matter.Constraint.create({
        pointA: anchor,
        bodyB: this.body,
        pointB: { x: offsetX, y: 0 },
        stiffness: this.template.stiffnessRange.start,
        damping: 0.2,
        render: { visible: DISPLAY_SETTINGS.constrainVisibility },
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
      // if (this.age % 4 === 0) this.createConstraints();
    }, this.calculateGrowthInterval());

    setTimeout(
      () => this.cellReproduction(),
      this.calculateReproductionDelay()
    );
  }

  expandStem() {
    this.width += PLANT_PARAMETERS.growIncrement;
    this.updateIntermediateState();
  }

  updateIntermediateState() {
    const transitionRatio = this.calculateTransitionRatio();
    this.updateColor(transitionRatio);
    this.updateConstraintsStiffness(transitionRatio);
  }

  calculateCellMaxIterations() {
    return (
      PLANT_PARAMETERS.maxIterations - this.generation * 0.5 - this.branchDepth * 4
    );
  }

  calculateTransitionRatio() {
    // Clamp the ratio between 0 and 1
    return Math.min(
      Math.max(this.age / this.calculateCellMaxIterations(), 0),
      1
    );
  }

  updateColor(transitionRatio) {
    const { start, end } = PLANT_PARAMETERS.templates.tree.transitionColors;
    const startRgb = this.hexToRgb(start);
    const endRgb = this.hexToRgb(end);
    const rgb = {
      r: Math.round(startRgb.r + (endRgb.r - startRgb.r) * transitionRatio),
      g: Math.round(startRgb.g + (endRgb.g - startRgb.g) * transitionRatio),
      b: Math.round(startRgb.b + (endRgb.b - startRgb.b) * transitionRatio),
    };
    this.body.render.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
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
    // this.body.render.fillStyle = this.template.transitionColors.end;
    // this.updateConstraintsStiffness(1);
    this.constraints.forEach((constraint) => {
      World.remove(world, constraint);
    });
  }

  growNewSegment() {
    if (
      this.branchDepth < this.template.maxDepth &&
      Math.random() < this.branchProbability()
    ) {
      const angleOffset = this.calculateBranchAngleOffset();

      new StemCell({
        width: PLANT_PARAMETERS.dimensions.width,
        height: this.height,
        parent: this,
        growthAngle: this.growthAngle + angleOffset,
        branchDepth: this.branchDepth + 1,
        template: this.template,
        generation: this.generation + 1,
        segmentLength: 0,
      });
    }

    new StemCell({
      width: PLANT_PARAMETERS.dimensions.width,
      parent: this,
      growthAngle: this.growthAngle,
      branchDepth: this.branchDepth,
      template: this.template,
      generation: this.generation + 1,
      segmentLength: 0,
    });
  }

  cellReproduction() {
    if (this.segmentLength == 5) {
      new LeaveCell(this);
    } else {
      new StemCell({
        width: PLANT_PARAMETERS.dimensions.width,
        parent: this,
        growthAngle: this.growthAngle,
        branchDepth: this.branchDepth,
        template: this.template,
        generation: this.generation + 1,
        segmentLength: this.segmentLength + 1,
      });
    }
  }

  branchProbability() {
    return this.template.branchProbability(this.generation);
  }

  calculateBranchAngleOffset() {
    const goldenAngle = 1.19998161486; // ~137.5 degrees
    if (Math.random() < 0.5) {
      return -goldenAngle;
    } else {
      return goldenAngle;
    }
  }

  calculateGrowthInterval() {
    return 10000 + (this.branchDepth * 50) / SIMULATION_SETTINGS.timeControl;
  }

  leafProbability() {
    //TODO
    return 1;
  }

  calculateReproductionDelay() {
    return (
      (2500 + this.generation * 100 + this.branchDepth * this.generation * 10) /
      SIMULATION_SETTINGS.timeControl
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
    this.radius = 2;

    this.body = Bodies.circle(position.x + 8, position.y, this.radius, {
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

    this.growNewSegment();
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
      render: { visible: DISPLAY_SETTINGS.constrainVisibility },
    });
  }

  createAnchorConstraints() {
    const leftAnchor = {
      x: this.body.position.x - 20 - this.radius * 5,
      y: SIMULATION_SETTINGS.BASE_POSITION.y,
    };
    const rightAnchor = {
      x: this.body.position.x + 20 + this.radius * 5,
      y: SIMULATION_SETTINGS.BASE_POSITION.y,
    };

    const createAnchorConstraint = (anchor, offsetX) =>
      Matter.Constraint.create({
        pointA: anchor,
        bodyB: this.body,
        pointB: { x: offsetX, y: 0 },
        stiffness: 0.8,
        damping: 0.2,
        render: { visible: DISPLAY_SETTINGS.constrainVisibility },
      });

    return [
      createAnchorConstraint(leftAnchor, -this.radius * 3),
      createAnchorConstraint(rightAnchor, -this.radius * 3),
    ];
  }

  growNewSegment() {
    this.parent.growNewSegment();
  }
}
