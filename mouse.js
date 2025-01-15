// ------- MOUSE INTERACTION -------

// // Mouse constraint to enable mouse interaction
// const mouse = Mouse.create(canvas);
// const mouseConstraint = MouseConstraint.create(engine, {
//   mouse: mouse,
//   constraint: {
//     stiffness: 0.2,
//     // render: {
//     //   visible: false, // Set to true if you want to see the constraint line
//     // },
//   },
// });
// World.add(world, mouseConstraint);

// create a body with an attractor
var attractiveBody = Bodies.circle(
  render.options.width / 2,
  render.options.height / 2,
  50,
  {
    isStatic: true,

    // example of an attractor function that
    // returns a force vector that applies to bodyB
    plugin: {
      attractors: [
        function (bodyA, bodyB) {
          return {
            x: (bodyA.position.x - bodyB.position.x) * 1e-7 * 0.1,
            y: (bodyA.position.y - bodyB.position.y) * 1e-7 * 0.1,
          };
        },
      ],
    },
  }
);

World.add(world, attractiveBody);

var mouse = Mouse.create(render.canvas);

Events.on(render, "afterRender", function () {
  // if (!mouse.position.x) {
  //   return;
  // }

  // smoothly move the attractor body towards the mouse
  Body.translate(attractiveBody, {
    x: (mouse.position.x - attractiveBody.position.x) * 0.25,
    y: (mouse.position.y - attractiveBody.position.y) * 0.25,
  });
});
