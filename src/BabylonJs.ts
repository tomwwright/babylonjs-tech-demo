import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  ActionManager,
  SetValueAction,
  Color3,
  StandardMaterial,
  ExecuteCodeAction,
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

  const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
  const material = new StandardMaterial("material", scene);
  material.diffuseColor = new Color3(0.4, 0.4, 0.4);
  material.specularColor = new Color3(0.4, 0.4, 0.4);
  material.emissiveColor = Color3.Purple();
  sphere.material = material;

  sphere.actionManager = new ActionManager(scene);
  sphere.actionManager.registerAction(
    new SetValueAction(
      ActionManager.OnPointerOverTrigger,
      sphere.material,
      "emissiveColor",
      Color3.White()
    )
  );

  const onPointerOver = () => {
    console.log("pointer over");
  };

  sphere.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, onPointerOver)
  );

  sphere.actionManager.registerAction(
    new SetValueAction(
      ActionManager.OnPointerOutTrigger,
      sphere.material,
      "emissiveColor",
      material.emissiveColor
    )
  );

  const onPointerOut = () => {
    console.log("pointer out");
  };

  sphere.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, onPointerOut)
  );

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
