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
  Observable,
} from "@babylonjs/core";
import { CursorContext } from "./Cursor";
import { SceneState } from "./SceneState";

let isInitialised = false;

type InitialiseBabylonJsProps = {
  cursor: CursorContext;
  observable: Observable<SceneState>;
};

export const initialiseBabylonJs = ({
  cursor,
  observable,
}: InitialiseBabylonJsProps) => {
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

  const updateCursor = (event: MouseEvent) => {
    cursor.setCursor({
      x: event.clientX,
      y: event.clientY,
      active: true,
    });
  };

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
    window.addEventListener("mousemove", updateCursor);
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
    window.removeEventListener("mousemove", updateCursor);
    cursor.setCursor({
      x: 0,
      y: 0,
      active: false,
    });
  };

  sphere.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, onPointerOut)
  );

  observable.add((state) => {
    console.log("from babylon", state);
    if (state.isOn) {
      material.alpha = 1;
    } else {
      material.alpha = 0;
    }
  });

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
