# Interactive Plant Growth Simulation via cell reproduction (recursion) 🌱

A lightweight, interactive physics simulation where plants procedurally grow, sway, and respond to your touch. Powered by JavaScript and the Matter.js 2D physics engine.

**[Try the Live Demo!](https://yellowo2.github.io/janky-plant-sim/)**

![Demo GIF of the plant simulation](./assets/demo.gif)

## Key Features

- **Procedural Generation:** Every plant grows in a unique way, segment by segment.
- **Physics-Based Movement:** Leverages the Matter.js engine to make the plant stems bend and sway realistically, and react to the touch of users.

## Challenges & Key Learnings

The main challenge was making the plant interactive and dynamic while it was still growing. It's one thing to apply physics to a static object, but it's much harder for an object that is constantly adding new parts to itself. Another difficulty was applying suitable constraints so that the plant does not topple down while maintaining flexibility.
Overall, it was a great learning about how plants grow, procedurally generating them with OOP and the concept of Constraints.
