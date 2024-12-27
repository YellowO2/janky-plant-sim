// Segment Class
class StemCellSelfTime {
  constructor(x, y, width = 12, height = 4) {
    this.age = 0; // How long the segment has existed
    this.width = width;
    this.height = height;
    this.body = Bodies.rectangle(x, y, width, height, {
      render: { fillStyle: "#6b8e23" },
    });
    World.add(world, this.body);
  }

  grow() {
    const timeControl = 2;
    setInterval(() => {
      this.age += 1; // Increase age
      this.width += 2; // Increase width linearly (adjust 0.2 for desired growth speed)
      // Directly modify width without scaling
      Matter.Body.scale(this.body, 1 + 2 / this.width, 1);
    }, 2000 / timeControl);

    // Trigger cell division after 5 seconds
    setTimeout(() => {
      this.cellDivision();
    }, 5000 / timeControl);
  }
  cellDivision() {
    const currentPosition = this.body.position;

    // Position the new cell above the current one
    const newX = currentPosition.x;
    const newY = currentPosition.y - this.height - 0.5;

    // Create a new StemCell
    const newStemCell = new StemCellSelfTime(newX, newY, 12, 4);

    // Log the position of the current and new stem cells
    console.log("Current Position:", currentPosition);
    console.log("New Stem Cell Position:", newStemCell.body.position);

    // Add two constraints to simulate cells sticking
    const constraintLeft = Matter.Constraint.create({
      bodyA: this.body,
      bodyB: newStemCell.body,
      pointA: { x: 0, y: 0 }, // Left side of first cell
      pointB: { x: 0, y: 0 }, // Left side of second cell
      length: this.height + 0.5,
      stiffness: 0.9,
    });

    // const constraintRight = Matter.Constraint.create({
    //   bodyA: this.body,
    //   bodyB: newStemCell.body,
    //   pointA: { x: this.width / 6, y: 0 }, // Right side of first cell
    //   pointB: { x: this.width / 6, y: 0 }, // Right side of second cell
    //   length: this.height + 1,
    //   stiffness: 0.9,
    // });

    World.add(world, constraintLeft);

    newStemCell.grow();
  }
}
