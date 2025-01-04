const timeControl = 5;
const WIDTH = 5;
const HEIGHT = 5;
const growIncrement = 1;
const maxIterations = 20;
const constrainVisibility = false;
const transitionPeriod = 8;

// StemCell Class
class StemCell {
  constructor(
    width = WIDTH,
    height = HEIGHT,
    parent,
    isBranch = false,
    branchDirection = null
  ) {
    this.age = 0;
    this.width = width;
    this.height = height;
    this.parent = parent;
    this.isBranch = isBranch;
    this.branchDirection = branchDirection; // "left" or "right"

    // Calculate initial position
    const currentPosition = parent.body.position;
    let newX = currentPosition.x;
    let newY = currentPosition.y - height - 1.5;

    if (isBranch) {
      const offset = branchDirection === "left" ? -10 : 10;
      newX += offset;
      newY -= 5;
    }

    this.body = Bodies.rectangle(newX, newY, width, height, {
      render: { fillStyle: "#6b8e23" },
      friction: 0.8,
      frictionAir: 0.1,
      restitution: 0.2,
    });

    World.add(world, this.body);

    this.constraints = [];
    this.createConstraints();

    this.grow();
  }

  createConstraints() {
    // Remove old constraints if any
    this.constraints.forEach((constraint) => World.remove(world, constraint));
    this.constraints = [];

    const createConstraint = (pointA, pointB) => {
      return Matter.Constraint.create({
        bodyA: this.parent.body,
        bodyB: this.body,
        pointA,
        pointB,
        stiffness: 0.6,
        damping: 0.1,
        render: { visible: constrainVisibility },
      });
    };

    this.constraints.push(createConstraint({ x: 0, y: 0 }, { x: 0, y: 0 }));
    this.constraints.push(
      createConstraint(
        { x: -this.width / 3, y: 0 },
        { x: this.width / 3, y: 0 }
      )
    );
    this.constraints.push(
      createConstraint(
        { x: this.width / 3, y: 0 },
        { x: -this.width / 3, y: 0 }
      )
    );

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

      // Scale the body to simulate growth
      Matter.Body.scale(this.body, 1 + growIncrement / this.width, 1);

      // Gradually transition color and increase stiffness
      if (this.age >= intermediateIterations) {
        this.updateIntermediateState();
      }

      // Update constraints periodically
      if (this.age % 4 === 0) {
        this.createConstraints();
      }
    }, 2500 / timeControl);

    // Trigger cell division after 5 seconds
    setTimeout(() => this.cellDivision(), 5000 / timeControl);
  }

  updateIntermediateState() {
    // Gradually darken the green color and shift toward light brown
    const transitionRatio =
      (this.age - (maxIterations - transitionPeriod)) / transitionPeriod;
    const startColor = { r: 107, g: 142, b: 35 }; // #6b8e23
    const endColor = { r: 107, g: 51, b: 35 }; // #6b3323

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

    // Gradually increase stiffness toward 1.0
    const newStiffness = 0.6 + 0.4 * transitionRatio; // Start at 0.5, end at 1.0
    this.updateConstraintsStiffness(newStiffness);
  }

  finalHarden() {
    Body.setStatic(this.body, true); // Make the stem rigid
    this.body.render.fillStyle = "#6b3323"; // Fully brown color
    this.updateConstraintsStiffness(1.0); // Max stiffness
  }

  updateConstraintsStiffness(newStiffness) {
    // Adjust stiffness of all constraints
    this.constraints.forEach((constraint) => {
      constraint.stiffness = newStiffness;
    });
  }

  cellDivision() {
    const branchingChance = Math.random();
    if (!this.isBranch && branchingChance < 0.1) {
      // 30% chance to create a left or right branch
      const branchDirection = Math.random() > 0.5 ? "left" : "right";
      new StemCell(WIDTH, HEIGHT, this, true, branchDirection);
    }

    // Always grow the main stem
    new StemCell(WIDTH, HEIGHT, this);
  }
}
