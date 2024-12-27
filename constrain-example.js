// add revolute multi-body constraint
var body = Bodies.rectangle(500, 400, 80, 10);
var ball = Bodies.circle(400, 400, 20, { isStatic: true });

var constraint = Constraint.create({
  bodyA: body,
  bodyB: ball,

  angleAStiffness: 0.9,
  // angleBMin: -0.1,
  // angleBMax: 0.1,
  angleBStiffness: 0.9,
});

World.add(world, [body, ball, constraint]);

var body2 = Bodies.rectangle(600, 400, 80, 10);

var constraint2 = Constraint.create({
  bodyA: body,
  bodyB: body2,
  // Attach `body2` at the right end of `body`
  pointA: { x: 20, y: 0 }, // Right end of `body`
  // pointB: { x: -50, y: 0 }, // Left end of `body2`
  angleAStiffness: 0.9,
  // angleBMin: -0.1,
  // angleBMax: 0.1,
  angleBStiffness: 0.9,
});

// World.add(world, [body2, constraint2]);

//NEW TEST
// Create two bodies
const bodyA = Bodies.rectangle(200, 200, 50, 50, {
  render: { fillStyle: "red" },
});
const bodyB = Bodies.rectangle(300, 200, 50, 50, {
  render: { fillStyle: "blue" },
});

const bodyC = Bodies.rectangle(400, 200, 50, 50, {
  render: { fillStyle: "red" },
});

// Option 1: Using a Constraint (preferred for maintaining relative position)
const constraint3 = Constraint.create({
  bodyA: bodyA,
  bodyB: bodyB,
  pointA: { x: 25, y: 0 }, // Offset from bodyA's center
  pointB: { x: -25, y: 0 }, // Offset from bodyB's center
  stiffness: 1, // High stiffness for rigid connection
  length: 10, // Zero length to keep them close
});

const constraint4 = Constraint.create({
  bodyA: bodyB,
  bodyB: bodyC,
  pointA: { x: 25, y: 0 }, // Offset from bodyB's center
  pointB: { x: -25, y: 0 }, // Offset from bodyC's center
  stiffness: 1, // High stiffness for rigid connection
  length: 10, // Zero length to keep them close
});

World.add(world, [bodyA, bodyB, bodyC, constraint3, constraint4]);
