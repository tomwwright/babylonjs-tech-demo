import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import {
  Animatable,
  Animation,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  ActionManager,
  Color3,
  StandardMaterial,
  ExecuteCodeAction,
  Observable,
  EasingFunction,
  SineEase,
  Nullable,
  Mesh,
  Tools,
  SceneLoader,
  DirectionalLight,
  CascadedShadowGenerator,
  SSAO2RenderingPipeline,
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
  // hovering for tooltip

  const updateCursor = (event: MouseEvent) => {
    setCursor({
      x: event.clientX,
      y: event.clientY,
      active: true,
    });
  };

  const onPointerOver = () => {
    window.addEventListener("mousemove", updateCursor);
  };

  const onPointerOut = () => {
    window.removeEventListener("mousemove", updateCursor);
    setCursor({
      x: 0,
      y: 0,
      active: false,
    });
  };

  // set up lighting

  const light = new DirectionalLight(
    "light",
    new Vector3(1, -1, 1).normalize(),
    scene
  );
  light.autoUpdateExtends = true;
  light.autoCalcShadowZBounds = true;
  new HemisphericLight("ambient", new Vector3(1, 1, 0), scene);

  const shadowGenerator = new CascadedShadowGenerator(4096, light);
  shadowGenerator.autoCalcDepthBounds = true;
  shadowGenerator.bias = 0.01;

  // set up map of hexagons

  const radius = 1;
  const spacing = 1.02;
  const spacingX = radius * spacing * 1.5;
  const spacingZ = radius * spacing * Math.sqrt(3);

  const template = MeshBuilder.CreateCylinder(
    "hexagon",
    { tessellation: 6, height: 0.1, diameter: radius * 2 },
    scene
  );
  const hexagonMaterial = new StandardMaterial("hexagon", scene);
  const highlightColor = new Color3(0.2, 0.2, 0.2);
  const mapSize = 10;
  const map: Mesh[][] = [];

  const setEmissiveColorAtPosition = (x: number, z: number, color: Color3) => {
    const material = map[x][z].material as StandardMaterial;
    material.emissiveColor = color;
  };

  const resetEmissiveColorAtPosition = (x: number, z: number) =>
    setEmissiveColorAtPosition(x, z, hexagonMaterial.emissiveColor);

  const onPointerOverHexagon = (x: number, z: number) => {
    for (let i = 0; i < mapSize; ++i) {
      setEmissiveColorAtPosition(x, i, highlightColor);
      setEmissiveColorAtPosition(i, z, highlightColor);
    }
    setEmissiveColorAtPosition(x, z, Color3.Green());
  };

  const onPointerOutHexagon = (x: number, z: number) => {
    for (let i = 0; i < mapSize; ++i) {
      resetEmissiveColorAtPosition(x, i);
      resetEmissiveColorAtPosition(i, z);
    }
  };

  for (let x = 0; x < mapSize; ++x) {
    const row: Mesh[] = [];
    map.push(row);
    for (let z = 0; z < mapSize; ++z) {
      const hexagon = template.clone();
      hexagon.material = hexagonMaterial.clone(`hexagon${x}${z}`);
      const offsetZ = (x % 2) * spacingZ * 0.5;
      hexagon.position = new Vector3(x * spacingX, 0, z * spacingZ + offsetZ);

      hexagon.actionManager = new ActionManager(scene);

      hexagon.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () =>
          onPointerOverHexagon(x, z)
        )
      );

      hexagon.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, onPointerOver)
      );

      hexagon.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () =>
          onPointerOutHexagon(x, z)
        )
      );

      hexagon.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, onPointerOut)
      );

      row.push(hexagon);
    }
  }

  scene.removeMesh(template);
  template.dispose();

  // demo reacting to state changes from react

  stateObservable.add((state) => {
    console.log("from babylon", state);
    const material = map[0][0].material as StandardMaterial;
    if (state.isOn) {
      material.alpha = 1;
    } else {
      material.alpha = 0;
    }
  });

  // configure camera controls

  camera.attachControl(canvas, true);

  camera.radius = 5;
  camera.upperRadiusLimit = 12;
  camera.lowerRadiusLimit = 1.5;

  camera.alpha = Math.PI;

  camera.mapPanning = true;
  const cameraAngleDegrees = (Math.PI / 180) * 45;
  camera.lowerBetaLimit = cameraAngleDegrees;
  camera.upperBetaLimit = cameraAngleDegrees;

  // max camera bounds

  const maxX = mapSize * spacingX;
  const maxZ = mapSize * spacingZ;

  const checkCameraTargetBounds = () => {
    if (camera.target.x < 0) {
      camera.target.x = 0;
    }
    if (camera.target.x > maxX) {
      camera.target.x = maxX;
    }

    if (camera.target.z < 0) {
      camera.target.z = 0;
    }
    if (camera.target.z > maxZ) {
      camera.target.z = maxZ;
    }
  };

  scene.actionManager.registerAction(
    new ExecuteCodeAction(
      ActionManager.OnEveryFrameTrigger,
      checkCameraTargetBounds
    )
  );

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

  // load assets

  const loadAssets = async () => {
    const assetArrayBuffer = await Tools.LoadFileAsync(
      "/grass_forest.glb",
      true
    );
    const assetBlob = new Blob([assetArrayBuffer]);
    const assetUrl = URL.createObjectURL(assetBlob);

    await SceneLoader.AppendAsync(
      assetUrl,
      undefined,
      scene,
      undefined,
      ".glb"
    );

    const forest = scene.getMeshByName("__root__");
    if (!forest) {
      console.log("unable to find loaded forest mesh!");
      return;
    }
    forest.rotate(Vector3.Up(), Math.PI / 6);
    forest.scalingDeterminant = 1.7;

    // put forests on each space
    for (let x = 0; x < mapSize; ++x) {
      for (let z = 0; z < mapSize; ++z) {
        const hexagon = map[x][z];
        const forestClone = forest.clone(`forest${x}${z}`, null);
        console.log(forestClone);
        // why is this nullable?
        if (forestClone) {
          forestClone.receiveShadows = true;
          for (const child of forestClone.getChildMeshes()) {
            child.receiveShadows = true;
          }
          shadowGenerator.addShadowCaster(forestClone, true);
          forestClone.position = hexagon.position;
        }
      }
    }

    console.log("loaded!");
  };

  loadAssets();

  // ambient occlusion

  const ssao = new SSAO2RenderingPipeline("ssao", scene, 1);
  ssao.samples = 16;
  ssao.bilateralSoften = 0.1;
  ssao.totalStrength = 1.0;
  ssao.radius = 0.5;

  ssao;
  scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
    "ssao",
    camera
  );

  // SSAO debugging

  //ssao.bypassBlur = true;

  // scene.postProcessRenderPipelineManager.disableEffectInPipeline(
  //   "ssao",
  //   ssao.SSAOCombineRenderEffect,
  //   camera
  // );
};
