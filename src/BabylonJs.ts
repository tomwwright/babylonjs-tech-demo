import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
  Animatable,
  Animation,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  ActionManager,
  SetValueAction,
  Color3,
  StandardMaterial,
  ExecuteCodeAction,
  Observable,
  EasingFunction,
  SineEase,
  Nullable,
} from "@babylonjs/core";
import { CursorState, useCursor } from "./Cursor";
import { SceneState, useSceneState } from "./SceneState";
import { useEffect, useRef } from "react";
import { BabylonJsContext, useBabylonJs } from "./BabylonJsProvider";

export const BablylonJs = () => {
  const babylonjs = useBabylonJs();

  const { setCursor } = useCursor();
  const { stateObservable, eventsObservable } = useSceneState();

  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;

      initialiseBabylonJs({
        setCursor,
        stateObservable,
        eventsObservable,
        ...babylonjs,
      });
    }
  }, [babylonjs, stateObservable, eventsObservable, setCursor]);

  return null;
};

interface InitialiseBabylonJsProps extends BabylonJsContext {
  setCursor: (cursor: CursorState) => void;
  stateObservable: Observable<SceneState>;
  eventsObservable: Observable<string>;
}

export const initialiseBabylonJs = ({
  setCursor,
  stateObservable,
  eventsObservable,
  canvas,
  camera,
  scene,
}: InitialiseBabylonJsProps) => {
  camera.attachControl(canvas, true);

  camera.radius = 3;
  camera.upperRadiusLimit = 5;
  camera.lowerRadiusLimit = 1.5;

  camera.mapPanning = true;
  camera.lowerBetaLimit = Math.PI / 3;
  camera.upperBetaLimit = Math.PI / 3;

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

  stateObservable.add((state) => {
    console.log("from babylon", state);
    if (state.isOn) {
      material.alpha = 1;
    } else {
      material.alpha = 0;
    }
  });

  // camera rotation

  const frameRate = 30;
  const rotate = new Animation(
    "rotation",
    "alpha",
    frameRate,
    Animation.ANIMATIONTYPE_FLOAT
  );
  const easing = new SineEase();
  easing.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
  rotate.setEasingFunction(easing);

  let currentAnimation: Nullable<Animatable>;
  const rotateCamera = (isLeft: boolean) => {
    if (currentAnimation) {
      console.error("cannot rotate when already rotating");
      return;
    }

    const onAnimationEnd = () => {
      currentAnimation = null;
    };

    const start = camera.alpha;
    const amount = Math.PI / 3;
    const end = isLeft ? camera.alpha + amount : camera.alpha - amount;

    rotate.setKeys([
      {
        frame: 0,
        value: start,
      },
      {
        frame: frameRate,
        value: end,
      },
    ]);

    currentAnimation = scene.beginDirectAnimation(
      camera,
      [rotate],
      0,
      frameRate,
      false,
      2, // 2x speed
      onAnimationEnd
    );
  };

  eventsObservable.add((event) => {
    console.log("from babylon", event);
    switch (event) {
      case "rotate-left":
        rotateCamera(false);
        break;
      case "rotate-right":
        rotateCamera(true);
        break;
    }
  });

  // set up scene objects

  const radius = 1;
  const spacingX = radius * 1.1 * 1.5;
  const spacingZ = radius * 1.1 * Math.sqrt(3);

  const template = MeshBuilder.CreateCylinder(
    "hexagon",
    { tessellation: 6, height: 0.1, diameter: radius * 2 },
    scene
  );

  for (const x of [0, 1, 2, 3, 4]) {
    for (const z of [0, 1, 2, 3, 4]) {
      const hexagon = template.clone();
      const offsetZ = (x % 2) * spacingZ * 0.5;
      hexagon.position = new Vector3(x * spacingX, 0, z * spacingZ + offsetZ);
    }
  }

  scene.removeMesh(template);
  template.dispose();

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
