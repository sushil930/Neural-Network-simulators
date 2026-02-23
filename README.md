
Neural Network Simulator
========================

Interactive backpropagation visualizer built with React, Vite, TypeScript, Tailwind, and SVG-based animations. Tune a tiny feedforward network, step through each training phase, watch activations and gradients animate, and inspect detailed logs plus formula references.

![Neural Network Simulator banner](public/banner.png)

Contents
--------
- What you get
- Quick start
- Usage guide
- Architecture overview
- Key files
- Scripts
- Environment

What you get
------------
- Interactive architecture controls: adjust input count, 1–4 hidden layers (1–5 neurons each), and target/learning rate sliders.
- Live canvas: draggable/zoomable SVG network with animated connections for forward, backward, and update phases; optional weight/value overlays.
- Training playback: auto-play with epoch count or manual phase stepping (FORWARD → ERROR → BACKWARD → UPDATE); reset anytime.
- Inspectable state: click neurons to view net input, activation, gradient, and bias; click connections to edit weights inline.
- Education page: phase-filterable training log plus formula cards (net input, sigmoid, MSE, gradients, weight/bias updates) and current network snapshot.
- Guided onboarding: multi-step tutorial tour highlighting main controls.
- Mobile guardrail: overlay prompts users on narrow/portrait viewports to switch to desktop or rotate.

Quick start
-----------
Prerequisites: Node.js 18+ recommended.

1. Install dependencies
	npm install
2. Run dev server (default http://localhost:3000)
	npm run dev
3. Build for production
	npm run build
4. Preview the production build
	npm run preview

Usage guide
-----------
1) Configure architecture & params (left sidebar)
- Adjust input neurons and hidden layer counts/sizes.
- Set target output and learning rate.
- Tune individual inputs.

2) Drive training
- Auto Play: runs continuous epochs (prompt allows finite or infinite).
- Step: advances one phase at a time for clarity (disabled during auto play).
- Reset: clears activations/gradients and restarts epoch counter.

3) Inspect & edit
- Click neurons to view values/gradients/biases; click weights to edit via popover or sliders.
- Toggle value overlays and zoom/pan on the canvas for readability.

4) Learn from the log
- Open “Log & Formulas” to filter log entries by phase and read formulas with contextual descriptions.

5) Mobile experience
- Narrow or portrait viewports show a dismissible notice to use desktop or rotate.

Architecture overview
---------------------
- State & logic: src/hooks/useNeuralNetwork.ts owns the network architecture, forward/error/backward/update steps, auto-play scheduler, log buffering (last 500 entries), and manual edits (weights/biases/inputs/params).
- Types & math: src/types.ts defines state/log shapes; src/utils/math.ts provides sigmoid/derivatives, MSE, formatting, and random initialization.
- UI composition: src/App.tsx wires sidebar, canvas, overlays, education page, tutorial tour, and mobile warning.
- Visualization: src/components/NetworkCanvas.tsx lays out layers; NeuronNode renders animated neurons; ConnectionLine renders animated edges for each phase.
- Control surfaces: src/components/Sidebar.tsx exposes sliders and weight/bias editors; src/components/WeightEditPopover.tsx and src/components/DetailsCard.tsx handle focused edits/inspections.
- Learning aids: src/components/EducationPage.tsx shows logs + formula cards; src/components/TutorialTour.tsx provides the guided overlay; src/components/MobileWarning.tsx gates mobile usage.
- Styling: Tailwind v4 via @tailwindcss/vite with light custom CSS in src/index.css.

Key files
---------
- src/App.tsx – top-level app layout and page routing (simulator vs. education).
- src/hooks/useNeuralNetwork.ts – core simulation state machine and backprop steps.
- src/components/NetworkCanvas.tsx – network layout, zoom/pan, and connection rendering.
- src/components/Sidebar.tsx – architecture/parameter controls and weight/bias sliders.
- src/components/EducationPage.tsx – training log and math formulas reference.
- src/components/TutorialTour.tsx – guided tour overlay.
- src/components/MobileWarning.tsx – mobile/portrait overlay prompt.
- src/utils/math.ts – activation/loss helpers.
- tailwind.config.ts, src/index.css – styling setup.

Scripts
-------
- npm run dev – start Vite dev server (0.0.0.0:3000).
- npm run build – production build.
- npm run preview – serve the build locally.
- npm run lint – type-check via tsc --noEmit.
- npm run clean – remove dist.

Environment
-----------
- GEMINI_API_KEY: read via Vite define for @google/genai; not required for the simulator to run. Leave unset if unused.

Notes
-----
- Tested for desktop-first experience; mobile shows a warning overlay but core UX targets larger screens.

