// plant-cell.js

let allStems = [];
let allLeaves = [];

class StemCell {
  constructor({
    width = 1,
    parent = null,
    growthAngle = 0,
    branchDepth = 0,
    template = settingsManager.getSettings().simulation.plantTemplate === "tree"
      ? TEMPLATES.tree
      : TEMPLATES.custom,
    generation = 0,
    segmentLength = 0,
  } = {}) {
    this.initializeProperties({
      width,
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
    parent,
    growthAngle,
    branchDepth,
    template,
    generation,
    segmentLength,
  }) {
    this.age = 0;
    this.width = width;
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
    this.body = Bodies.circle(position.x, position.y, this.width, {
      render: { fillStyle: this.template.transitionColors.start },
      frictionAir: 0.5,
      restitution: 0.2,
      collisionFilter: { group: this.growthAngle === -1 },
    });
    World.add(world, this.body);
    allStems.push(this);
  }

  calculatePosition() {
    const parentPos = this.parent
      ? this.parent.body.position
      : {
          x: window.innerWidth / 2,
          y: window.innerHeight - window.innerHeight / 5,
        };
    return {
      x:
        parentPos.x +
        Math.sin(this.growthAngle) *
          settingsManager.getSettings().simulation.cellSpacing,
      y:
        parentPos.y -
        Math.cos(this.growthAngle) *
          settingsManager.getSettings().simulation.cellSpacing,
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
      render: {
        visible: settingsManager.getSettings().display.constrainVisibility,
      },
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
        render: {
          visible: settingsManager.getSettings().display.constrainVisibility,
        },
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
    }, this.calculateGrowthInterval());

    setTimeout(
      () => this.cellReproduction(),
      this.calculateReproductionDelay()
    );
  }

  expandStem() {
    this.width += settingsManager.getSettings().simulation.growIncrement;
    this.updateIntermediateState();
  }

  calculateGrowthInterval() {
    return (
      10000 +
      (this.branchDepth * 50) /
        settingsManager.getSettings().simulation.timeControl
    );
  }

  calculateReproductionDelay() {
    return (
      (2500 + this.generation * 100 + this.branchDepth * this.generation * 10) /
      settingsManager.getSettings().simulation.timeControl
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

  updateIntermediateState() {
    const transitionRatio = this.calculateTransitionRatio();
    this.updateColor(transitionRatio);
    this.updateConstraintsStiffness(transitionRatio);
  }

  calculateCellMaxIterations() {
    return (
      settingsManager.getSettings().simulation.maxIterations -
      this.generation * 0.5 -
      this.branchDepth * 4
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
    const { start, end } = TEMPLATES.tree.transitionColors;
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
        width: settingsManager.getSettings().simulation.cellSize,
        parent: this,
        growthAngle: this.growthAngle + angleOffset,
        branchDepth: this.branchDepth + 1,
        template: this.template,
        generation: this.generation + 1,
        segmentLength: 0,
      });
    }

    new StemCell({
      width: settingsManager.getSettings().simulation.cellSize,
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
        width: settingsManager.getSettings().simulation.cellSize,
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

  leafProbability() {
    //TODO
    return 1;
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
      render: { visible: false },
    });
  }

  createAnchorConstraints() {
    const leftAnchor = {
      x: this.body.position.x - 20 - this.radius * 5,
      y: this.body.position.y + 4,
    };
    const rightAnchor = {
      x: this.body.position.x + 20 + this.radius * 5,
      y: this.body.position.y + 4,
    };

    const createAnchorConstraint = (anchor, offsetX) =>
      Matter.Constraint.create({
        pointA: anchor,
        bodyB: this.body,
        pointB: { x: offsetX, y: 0 },
        stiffness: 0.8,
        damping: 0.2,
        render: { visible: false },
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
