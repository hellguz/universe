# 🌌 Universe Simulator

A real-time, interactive N-body simulation that visualizes cosmic evolution from the Big Bang to the present day. Watch millions of particles coalesce under gravity to form galaxies, stars, and black holes, all rendered in your browser at 60fps.

This project is an immersive digital laboratory for exploring astrophysical concepts. It starts from initial conditions inspired by inflationary cosmology—with smooth density perturbations and tidal angular momentum—and lets you watch as complex structures emerge entirely from fundamental physics.

## How To Start
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/universe-simulator.git

    cd universe-simulator
    ```
2. **Install Dependencies:**
3.   ```bash
    yarn install
    ``` 
4. **Run the Development Server:**
5.   ```bash
    yarn dev
    ```
6. **Open in Browser:**
7.   Navigate to `http://localhost:5173` to see the simulation in action.




---

## ✨ Core Features

* **Massive Scale:** Simulates **2.25 million particles** (1500x1500 texture) at a consistent 60fps.
* **Interactive Time Control:** Play, pause, and adjust the speed of cosmic evolution. A single simulation second represents **23 million years** (Myr), allowing you to witness 13.8 billion years (Gyr) in just 10 minutes.
* **Full Stellar Lifecycle:** The simulation doesn't just move dots. It models the entire life of a star:
    * **Star Formation:** Primordial gas cools and collapses in dense regions to form new stars (Main Sequence).
    * **Stellar Aging:** Stars age over time, eventually swelling into **Red Giants**.
    * **Stellar Death:** Low-mass stars end their lives as **White Dwarfs**, while massive stars explode in **Supernovae**, leaving behind **Neutron Stars** or **Black Holes**.
* **High-Performance GPU Physics:** All physics, state transitions, and rendering are performed **100% on the GPU** using a Frame Buffer Object (FBO) "ping-pong" technique.
* **Optimized Gravity:** Features a toggleable gravity system. You can switch instantly between a simple, fixed-sample approximation and a high-performance **Barnes-Hut (O(N log N)) algorithm** to see the dramatic difference in performance and accuracy.
* **Stunning Visuals:** A custom GLSL shader pipeline uses additive blending and a **Bloom post-processing effect** to create a beautiful, glowing "nebula" aesthetic for gas clouds and bright stars.
* **Live Data HUD:** A minimalist interface displays real-time statistics, including FPS, total particle count, universe age in billions of years, and a detailed breakdown of all particle types (Dark Matter, Gas, Main Sequence, Red Giants, Black Holes, etc.).

---

## 🚀 How It Works

The simulation's performance is achieved by offloading all computation to the GPU. The state of every particle is stored in massive floating-point textures, not in JavaScript.

### 1. GPU-Based Simulation (FBO)

This project uses a "ping-pong" rendering technique with Frame Buffer Objects (FBOs).

1.  **State Textures:** We maintain two sets of `WebGLRenderTarget` (float textures) for both **position** and **velocity**. Let's call them Set A and Set B.
    * `positionTexture`: Stores `(x, y, z, particleType)`
    * `velocityTexture`: Stores `(vx, vy, vz, ageOrTemperature)`
2.  **Simulation Pass (Physics):** In this pass, we run a custom GLSL fragment shader. It **reads** from the textures in Set A to calculate physics (like gravity and state changes) and **writes** the *new* state into the textures in Set B.
3.  **Render Pass (Visualization):** In this pass, a different shader **reads** from the newly updated textures in Set B to draw the particles to the screen.
4.  **The "Ping-Pong":** On the next frame, the roles are swapped. The simulation pass reads from Set B and writes to Set A. This cycle repeats, allowing the simulation to evolve entirely on the GPU without costly CPU readbacks.

### 2. Physics & Evolution Model

All the "magic" happens inside custom GLSL shaders.

* **Barnes-Hut Gravity (`velocityFragment.glsl`):** To calculate gravity efficiently, we first build a 3D mass-distribution grid (which is flattened into a 2D texture). The velocity shader then traverses this grid for each particle, using the Barnes-Hut approximation to calculate the net gravitational force from millions of other particles in O(N log N) time.
* **Stellar Evolution (`stateFragment.glsl`):** This shader is a massive state machine. On every frame, it checks each particle's type, age, and local environment (density, temperature) to see if it should transition.
    * A `Gas` particle (Type 1.0) in a cold, dense area may become a `Star` (Type 2.0).
    * A `Star` whose `age` (from `velocity.w`) exceeds `0.7` will transition to a `Red Giant` (Type 2.5).
    * A `Red Giant` whose `age` exceeds `0.95` becomes a `White Dwarf` (Type 3.0).
    * A `Massive Red Giant` (Type 2.502) whose `age` exceeds `0.85` will become a `Neutron Star` (Type 4.0) or `Black Hole` (Type 5.0).
* **Aging & Cooling (`velocityStateFragment.glsl`):** This shader is responsible for updating the `ageOrTemperature` value. If the particle is `Gas`, it cools it down. If it's a `Star` or `Red Giant`, it increments its `age`.

---

## 💻 Technology Stack

* **Frontend:** React 18 (with Vite)
* **Language:** TypeScript
* **3D Rendering:** Three.js & React Three Fiber
* **Helpers:** React Three Drei
* **Post-Processing:** React Three Postprocessing
* **State Management:** Zustand
* **Shaders:** GLSL (via `vite-plugin-glsl`)

---

## 🛠️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

You must have [Node.js](https://nodejs.org/) (v18+) and [Yarn](https://yarnpkg.com/) installed on your system.

### 1. Installation

Clone the repository and install the dependencies.

```bash
# 1. Clone the repository
git clone [https://github.com/your-username/universe-simulator.git](https://github.com/your-username/universe-simulator.git)

# 2. Navigate into the project directory
cd universe-simulator

# 3. Install packages with Yarn
yarn install
````

### 2\. Running the Development Server

To start the simulation in development mode with hot-reloading:

```bash
# Run the dev server
yarn dev
```

Vite will automatically open the project in your default browser at `http://localhost:5173`.

### 3\. Building for Production

To create an optimized, static build of the project:

```bash
# Build the project
yarn build
```

The optimized files will be output to the `/dist` directory. You can preview the production build locally using `yarn preview`.

-----

## 📁 Project Structure

The project code is organized as follows:

```
universe-simulator/
├── /public/              # Static assets
├── /src/
│   ├── /components/      # React components (Scene.tsx, ControlPanel.tsx, HUD.tsx)
│   ├── /shaders/         # All GLSL shader files
│   │   ├── /massGrid/    # Barnes-Hut mass grid shaders
│   │   ├── /render/      # Particle visualization shaders
│   │   └── /simulation/  # Physics (velocity, position) & state transition shaders
│   ├── /simulation/      # TypeScript setup for FBOs & ShaderMaterials
│   ├── /store/           # Zustand global state (simulationStore.ts)
│   ├── /types/           # TypeScript type definitions
│   ├── /utils/           # Constants and data texture generation (dataTexture.ts)
│   ├── App.tsx           # Main app component
│   └── main.tsx          # React entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

-----

## 📄 License

This project is licensed under the MIT License.
