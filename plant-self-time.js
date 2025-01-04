const timeControl = 10;
const WIDTH = 5;
const HEIGHT = 5;
const growIncrement = 1;
const maxIterations = 12;

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
        stiffness: 0.5,
        damping: 0.1,
        render: { visible: false },
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
    const intervalId = setInterval(() => {
      if (this.age >= maxIterations) {
        clearInterval(intervalId);
        Body.setStatic(this.body, true);
        this.body.render.fillStyle = "#6b3";
        return;
      }

      this.age += 1;
      this.width += growIncrement;
      Matter.Body.scale(this.body, 1 + growIncrement / this.width, 1);

      if (this.age % 4 === 0) {
        this.createConstraints();
      }
    }, 4500 / timeControl);

    setTimeout(() => this.cellDivision(), 5000 / timeControl);
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
