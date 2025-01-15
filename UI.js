// Define settings schema that will drive both the UI and settings management
const SETTINGS_SCHEMA = {
  simulation: {
    label: "Pre-Growth Settings",
    settings: {
      timeControl: {
        type: "number",
        label: "Time Control",
        default: 10,
        min: 1,
        max: 100,
        step: 1,
        category: "pre-growth",
      },
      cellSpacing: {
        type: "number",
        label: "Cell Spacing",
        default: 10,
        min: 1,
        max: 50,
        step: 1,
        category: "pre-growth",
      },
      growIncrement: {
        type: "number",
        label: "Grow Increment",
        default: 0.5,
        min: 0.1,
        max: 5,
        step: 0.1,
        category: "pre-growth",
      },
      maxIterations: {
        type: "number",
        label: "Max Growth Iterations",
        default: 80,
        min: 10,
        max: 200,
        step: 1,
        category: "pre-growth",
      },
      cellSize: {
        type: "number",
        label: "The size of the physics simulation cell",
        default: 1,
        min: 0.5,
        max: 20,
        step: 0.5,
        category: "pre-growth",
      },
      plantTemplate: {
        type: "select",
        label: "Plant Template",
        default: "tree",
        options: [
          { value: "tree", label: "Tree" },
          { value: "custom", label: "Custom" },
        ],
        category: "pre-growth",
      },
    },
  },
  display: {
    label: "Real-Time Display Settings",
    settings: {
      constrainVisibility: {
        type: "boolean",
        label: "Constrain Visibility",
        default: false,
        category: "runtime",
      },
      renderSkin: {
        type: "boolean",
        label: "Render Plant Skin",
        default: true,
        category: "runtime",
      },
    },
  },
};

class Seed {
  constructor(x, y) {
    this.body = Bodies.rectangle(x, y, 40, 8, { isStatic: true });
    World.add(world, this.body);
  }
}
// Templates containing complex configuration that doesn't fit in the settings schema
const TEMPLATES = {
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
};

class SettingsManager {
  constructor(schema) {
    this.schema = schema;
    this.settings = this.initializeSettings();
    this.observers = [];
  }

  initializeSettings() {
    const settings = {};
    Object.entries(this.schema).forEach(([category, categoryData]) => {
      settings[category] = {};
      Object.entries(categoryData.settings).forEach(([key, setting]) => {
        if (setting.type === "object") {
          settings[category][key] = {};
          Object.entries(setting).forEach(([subKey, subSetting]) => {
            if (subSetting.default !== undefined) {
              settings[category][key][subKey] = subSetting.default;
            }
          });
        } else {
          settings[category][key] = setting.default;
        }
      });
    });
    return settings;
  }

  updateSetting(category, key, value) {
    if (key.includes(".")) {
      const [mainKey, subKey] = key.split(".");
      this.settings[category][mainKey] = this.settings[category][mainKey] || {};
      this.settings[category][mainKey][subKey] = value;
    } else {
      this.settings[category][key] = value;
    }
    this.notifyObservers({ category, key, value });
  }

  addObserver(callback) {
    this.observers.push(callback);
  }

  notifyObservers(change) {
    this.observers.forEach((callback) => callback(change));
  }

  generateUI(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    Object.entries(this.schema).forEach(([category, categoryData]) => {
      const section = document.createElement("div");
      section.className = "settings-section mb-4";

      const heading = document.createElement("h2");
      heading.textContent = categoryData.label;
      section.appendChild(heading);

      Object.entries(categoryData.settings).forEach(([key, setting]) => {
        if (key === "dimensions") {
          // Handle dimensions object specially
          Object.entries(setting).forEach(([dimKey, dimSetting]) => {
            this.createSettingUI(
              section,
              category,
              `dimensions.${dimKey}`,
              dimSetting
            );
          });
        } else {
          this.createSettingUI(section, category, key, setting);
        }
      });

      container.appendChild(section);
    });

    // Add start button
    const startButton = document.createElement("button");
    startButton.id = "startButton";
    startButton.className = "btn btn-primary mt-3";
    startButton.textContent = "Start Growth";
    container.appendChild(startButton);

    return startButton;
  }

  createSettingUI(container, category, key, setting) {
    const wrapper = document.createElement("div");
    wrapper.className = "mt-4";
    wrapper.style = "margin-top: 1rem;"

    const label = document.createElement("label");
    label.className = "form-label ";
    label.textContent = setting.label + " ";
    wrapper.appendChild(label);

    let input;

    switch (setting.type) {
      case "number":
        input = document.createElement("input");
        input.type = "number";
        input.className = "form-control";
        input.min = setting.min;
        input.max = setting.max;
        input.step = setting.step;
        input.value = key.includes(".")
          ? this.settings[category][key.split(".")[0]][key.split(".")[1]]
          : this.settings[category][key];
        break;

      case "select":
        input = document.createElement("select");
        input.className = "form-select";
        setting.options.forEach((option) => {
          const opt = document.createElement("option");
          opt.value = option.value;
          opt.textContent = option.label;
          input.appendChild(opt);
        });
        input.value = this.settings[category][key];
        break;

      case "boolean":
        const switchDiv = document.createElement("div");
        switchDiv.className = "form-check form-switch";
        input = document.createElement("input");
        input.type = "checkbox";
        input.className = "form-check-input";
        input.checked = this.settings[category][key];
        switchDiv.appendChild(input);
        wrapper.appendChild(switchDiv);
        break;
    }

    if (setting.category === "pre-growth") {
      // input.disabled = true;
      this.preGrowthInputs = this.preGrowthInputs || [];
      this.preGrowthInputs.push(input);
    }

    input.addEventListener("change", (e) => {
      const value =
        setting.type === "number"
          ? parseFloat(e.target.value)
          : setting.type === "boolean"
          ? e.target.checked
          : e.target.value;
      this.updateSetting(category, key, value);
    });

    if (setting.type !== "boolean") {
      wrapper.appendChild(input);
    }
    container.appendChild(wrapper);
  }

  setPreGrowthSettingsLocked(locked) {
    if (this.preGrowthInputs) {
      this.preGrowthInputs.forEach((input) => (input.disabled = locked));
    }
  }

  getSettings() {
    return this.settings;
  }
}

// Initialize settings manager
const settingsManager = new SettingsManager(SETTINGS_SCHEMA);

// Usage
document.addEventListener("DOMContentLoaded", () => {
  // Generate UI
  const startButton = settingsManager.generateUI("UIContainer");

  // Add observer to log changes
  settingsManager.addObserver((change) => {
    console.log("Settings updated:", change);
  });

  let growthStarted = false;

  // Handle start button click
  startButton.addEventListener("click", () => {
    if (!growthStarted) {
      growthStarted = true;
      settingsManager.setPreGrowthSettingsLocked(true);
      startButton.textContent = "Growth In Progress";
      startButton.disabled = true;

      // Initialize growth with current settings
      const settings = settingsManager.getSettings();

      // Seed initialization
      const seed = new Seed(
        window.innerWidth / 2,
        window.innerHeight - window.innerHeight / 5
      );
      console.log("setting", settings);

      // Initialize the root stem
      const rootStem = new StemCell({
        parent: seed,
        width: settings.simulation.cellSize,
      });
    }
  });
});
