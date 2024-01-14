import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
} from "@babylonjs/core";

let isInitialised = false;

export const initialiseBabylonJs = () => {
  if (isInitialised) {
    return;
  }
  isInitialised = true;

  const canvas = document.getElementById("babylonjs") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Unable to locate canvas element");
    return;
  }

  // initialize babylon scene and engine
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  const camera: ArcRotateCamera = new ArcRotateCamera(
    "Camera",
    Math.PI / 2,
    Math.PI / 2,
    2,
    Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);

  new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

  MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

  // hide/show the Inspector
  window.addEventListener("keydown", (ev) => {
    // Shift+Ctrl+Alt+I
    if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
      if (scene.debugLayer.isVisible()) {
        scene.debugLayer.hide();
      } else {
        scene.debugLayer.show();
      }
    }
  });

  // run the main render loop
  engine.runRenderLoop(() => {
    scene.render();
  });
};
