import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
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
import { CursorState, useCursor } from "./Cursor";
import { SceneState, useSceneState } from "./SceneState";
import { useEffect, useRef } from "react";
import { BabylonJsContext, useBabylonJs } from "./BabylonJsProvider";

export const BablylonJs = () => {
  const babylonjs = useBabylonJs();

  const { setCursor } = useCursor();
  const { observable } = useSceneState();

  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;

      initialiseBabylonJs({
        setCursor,
        observable,
        ...babylonjs,
      });
    }
  }, [babylonjs, observable, setCursor]);

  return null;
};

interface InitialiseBabylonJsProps extends BabylonJsContext {
  setCursor: (cursor: CursorState) => void;
  observable: Observable<SceneState>;
}

export const initialiseBabylonJs = ({
  setCursor,
  observable,
  canvas,
  camera,
  scene,
}: InitialiseBabylonJsProps) => {
  camera.attachControl(canvas, true);

  new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

  const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
  const material = new StandardMaterial("material", scene);
  material.diffuseColor = new Color3(0.4, 0.4, 0.4);
  material.specularColor = new Color3(0.4, 0.4, 0.4);
  material.emissiveColor = Color3.Purple();
  sphere.material = material;

  const updateCursor = (event: MouseEvent) => {
    setCursor({
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
    setCursor({
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

  const sphere2 = MeshBuilder.CreateSphere("sphere2", { diameter: 0.5 }, scene);
  sphere2.position.x = 1.5;
  sphere2.position.z = -1;
  const material2 = new StandardMaterial("material2", scene);
  material2.diffuseColor = new Color3(0.4, 0.4, 0.4);
  material2.specularColor = new Color3(0.4, 0.4, 0.4);
  material2.emissiveColor = Color3.Green();
  sphere2.material = material2;

  sphere2.actionManager = new ActionManager(scene);
  sphere2.actionManager.registerAction(
    new SetValueAction(
      ActionManager.OnPointerOverTrigger,
      sphere2.material,
      "emissiveColor",
      Color3.White()
    )
  );

  sphere2.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, onPointerOver)
  );

  sphere2.actionManager.registerAction(
    new SetValueAction(
      ActionManager.OnPointerOutTrigger,
      sphere2.material,
      "emissiveColor",
      material2.emissiveColor
    )
  );

  sphere2.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, onPointerOut)
  );
};
