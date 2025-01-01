const timeControl = 2;
const WIDTH = 20;
const HEIGHT = 8;
const growIncrement = 1;
const maxIterations = 20;

// Segment Class

class StemCellSelfTime {
  constructor(x, y, width = WIDTH, height = HEIGHT) {
    this.age = 0; // How long the segment has existed
    this.width = width;
    this.height = height;
    this.body = Bodies.rectangle(x, y, width, height, {
      render: { fillStyle: "#6b8e23" },
    });
    this.newStemCell = null;
    World.add(world, this.body);
  }

  grow() {
    let iterations = 0;

    const intervalId = setInterval(() => {
      if (iterations >= maxIterations) {
        clearInterval(intervalId); // Stop the interval after reaching the limit
        return;
      }

      this.age += 1; // Increase age
      this.width += 2; // Increase width linearly (adjust 0.2 for desired growth speed)
      Matter.Body.scale(this.body, 1 + 2 / this.width, 1); // Scale the body
      this.recreateConstraints(); // Update constraints

      iterations++; // Increment the counter
    }, 2000 / timeControl);

    // Trigger cell division after 5 seconds
    setTimeout(() => {
      this.cellDivision();
    }, 5000 / timeControl);
  }

  recreateConstraints() {
    if (!this.newStemCell) {
      return;
    }

    // Remove old constraints
    if (this.constraintLeft) World.remove(world, this.constraintLeft);
    if (this.constraintRight) World.remove(world, this.constraintRight);

    this.constraintLeft = Matter.Constraint.create({
      bodyA: this.body,
      bodyB: this.newStemCell.body,
      pointA: { x: -this.width / 3, y: 0 },
      pointB: { x: this.width / 3, y: 0 },
      stiffness: 0.97,
    });

    this.constraintRight = Matter.Constraint.create({
      bodyA: this.body,
      bodyB: this.newStemCell.body,
      pointA: { x: this.width / 3, y: 0 },
      pointB: { x: -this.width / 3, y: 0 },
      stiffness: 0.97,
    });

    // Add updated constraints to the world
    World.add(world, [this.constraintLeft, this.constraintRight]);
  }

  cellDivision() {
    const currentPosition = this.body.position;

    // Position the new cell above the current one
    const newX = currentPosition.x;
    const newY = currentPosition.y - this.height - 0.5;

    // Create a new StemCell
    this.newStemCell = new StemCellSelfTime(newX, newY, WIDTH, HEIGHT);

    // Add two constraints to simulate cells sticking
    this.constraintCenter = Matter.Constraint.create({
      bodyA: this.body,
      bodyB: this.newStemCell.body,
      pointA: { x: 0, y: 0 }, // Left side of first cell
      pointB: { x: 0, y: 0 }, // Left side of second cell
      length: this.height + 0.5,
      stiffness: 1,
    });

    this.constraintLeft = Matter.Constraint.create({
      bodyA: this.body,
      bodyB: this.newStemCell.body,
      pointA: { x: -this.width / 3, y: 0 }, // Left side of first cell
      pointB: { x: this.width / 3, y: 0 },
      stiffness: 0.9,
      damping: 0.1,
    });

    this.constraintRight = Matter.Constraint.create({
      bodyA: this.body,
      bodyB: this.newStemCell.body,
      pointA: { x: this.width / 3, y: 0 },
      pointB: { x: -this.width / 3, y: 0 },
      stiffness: 0.9,
      damping: 0.1,
    });

    World.add(world, [
      this.constraintLeft,
      this.constraintRight,
      this.constraintCenter,
    ]);

    this.newStemCell.grow();
  }
}
