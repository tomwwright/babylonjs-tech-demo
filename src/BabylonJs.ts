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
  DefaultRenderingPipeline,
  DepthOfFieldEffectBlurLevel,
  MirrorTexture,
  Plane,
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
  engine,
  canvas,
  camera,
  scene,
}: InitialiseBabylonJsProps) => {
  // reporting fps

  setInterval(() => {
    const fps = engine.getFps()
    eventsObservable.notifyObservers(`report-fps;${fps}`)
  }, 2000)
  
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
  const amblientLight = new HemisphericLight(
    "ambient",
    new Vector3(1, 1, 0),
    scene
  );

  const shadowGenerator = new CascadedShadowGenerator(4096, light);
  shadowGenerator.autoCalcDepthBounds = true;
  shadowGenerator.bias = 0.01;
  shadowGenerator.usePercentageCloserFiltering = true;

  eventsObservable.add((event) => {
    if(event === "toggle-shadows") {
      light.shadowEnabled = !light.shadowEnabled;
    }
  })

  // set up map of hexagons

  const radius = 1;
  const spacing = 1.02;
  const spacingX = radius * spacing * 1.5;
  const spacingZ = radius * spacing * Math.sqrt(3);

  const template = MeshBuilder.CreateCylinder(
    "hexagon",
    { tessellation: 6, height: 1, diameter: radius * 2 },
    scene
  );
  const hexagonMaterial = new StandardMaterial("hexagon", scene);
  hexagonMaterial.specularColor = Color3.Black();
  hexagonMaterial.diffuseColor = Color3.Black();
  hexagonMaterial.alpha = 0;
  const highlightColor = Color3.White();
  const mapSize = 10;
  const map: Mesh[][] = [];

  const setColorAndAlphaAtPosition = (
    x: number,
    z: number,
    color: Color3,
    alpha: number
  ) => {
    const material = map[x][z].material as StandardMaterial;
    material.alpha = alpha;
    material.diffuseColor = color;
  };

  const resetColorAndAlphaAtPosition = (x: number, z: number) =>
    setColorAndAlphaAtPosition(x, z, hexagonMaterial.emissiveColor, 0);

  const onPointerOverHexagon = (x: number, z: number) => {
    for (let i = 0; i < mapSize; ++i) {
      setColorAndAlphaAtPosition(x, i, highlightColor, 0.1);
      setColorAndAlphaAtPosition(i, z, highlightColor, 0.1);
    }
    setColorAndAlphaAtPosition(x, z, Color3.Green(), 0.4);
  };

  const onPointerOutHexagon = (x: number, z: number) => {
    for (let i = 0; i < mapSize; ++i) {
      resetColorAndAlphaAtPosition(x, i);
      resetColorAndAlphaAtPosition(i, z);
    }
  };

  for (let x = 0; x < mapSize; ++x) {
    const row: Mesh[] = [];
    map.push(row);
    for (let z = 0; z < mapSize; ++z) {
      const hexagon = template.clone();
      hexagon.material = hexagonMaterial.clone(`hexagon${x}${z}`);
      const offsetZ = (x % 2) * spacingZ * 0.5;
      hexagon.position = new Vector3(x * spacingX, 0.5, z * spacingZ + offsetZ);

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

  // configure camera controls

  camera.attachControl(canvas, true);

  const maxCameraDistance = 12;
  camera.radius = 5;
  camera.upperRadiusLimit = maxCameraDistance;
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

  // reflective ground

  const skybox = MeshBuilder.CreateBox("skybox", { size: 100.0 }, scene);
  skybox.position = new Vector3(maxX / 2, -2, maxZ / 2);
  const skyboxMaterial = new StandardMaterial("skybox", scene);
  skyboxMaterial.emissiveColor = new Color3(0.3, 0.3, 0.7);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.disableLighting = true;
  skybox.material = skyboxMaterial;

  // sin(A) = perp / hyp
  const visibleSurroundingDistance =
    Math.sin(cameraAngleDegrees) * maxCameraDistance * 2.25;

  const width = maxX + 2 * visibleSurroundingDistance;
  const height = maxZ + 2 * visibleSurroundingDistance;

  const ground = MeshBuilder.CreateGround("ground", { width, height });
  ground.position = new Vector3(maxX / 2, 0, maxZ / 2);
  ground.receiveShadows = true;
  const groundMaterial = new StandardMaterial("ground");
  const mirrorTexture = new MirrorTexture("mirror", { ratio: 0.25 }, scene);
  mirrorTexture.mirrorPlane = Plane.FromPositionAndNormal(
    ground.position,
    ground.getFacetNormal(0).scale(-1)
  );
  mirrorTexture.renderList = [skybox];
  mirrorTexture.adaptiveBlurKernel = 64;

  groundMaterial.reflectionTexture = mirrorTexture;
  groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.3);
  groundMaterial.specularColor = new Color3(0.2, 0.2, 0.3);
  ground.material = groundMaterial;

  amblientLight.excludedMeshes.push(ground);

  eventsObservable.add((event) => {
    if(event === "toggle-hardware-scaling-level") {
      const scalingLevels = [1, 2, 4]
      const i = scalingLevels.findIndex(level => level === engine.getHardwareScalingLevel())
      const newHardwareScalingLevel = scalingLevels[(i + 1) % scalingLevels.length]
      engine.setHardwareScalingLevel(newHardwareScalingLevel)
    }
  });

  // demo reacting to state changes from react

  stateObservable.add((state) => {
    console.log("from babylon", state);
    if (state.isOn) {
      ground.setEnabled(true)
    } else {
      ground.setEnabled(false)
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
        // why is this nullable?
        if (forestClone) {
          forestClone.receiveShadows = true;
          for (const child of forestClone.getChildMeshes()) {
            child.receiveShadows = true;

            // comment me for reflections
            mirrorTexture.renderList?.push(child);
          }

          // comment me for shadows
          shadowGenerator.addShadowCaster(forestClone, true);

          forestClone.position = new Vector3(
            hexagon.position.x,
            0,
            hexagon.position.z
          );
        }
      }
    }

    console.log("loaded!");
  };

  loadAssets();

  // set up rendering

  const renderer = new DefaultRenderingPipeline("renderer", true, scene, [
    camera,
  ]);

  // anti aliasing

  renderer.fxaaEnabled = true;

  // depth of field

  renderer.depthOfFieldEnabled = true;
  renderer.depthOfField.fStop = 1.2;
  renderer.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.High;

  const setCameraFocalLength = () => {
    renderer.depthOfField.focusDistance = camera.radius * 1000;
  };

  scene.actionManager.registerAction(
    new ExecuteCodeAction(
      ActionManager.OnEveryFrameTrigger,
      setCameraFocalLength
    )
  );

  // ambient occlusion

  const ssao = new SSAO2RenderingPipeline("ssao", scene, 1);
  ssao.samples = 16;
  ssao.bilateralSoften = 0.1;
  ssao.totalStrength = 1.0;
  ssao.radius = 0.5;

  scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
    "ssao",
    camera
  );

  // SSAO debugging

  let currentSSAO = "enabled"
  stateObservable.add((state) => {
    if(state.ssao === currentSSAO) {
      return
    }
    currentSSAO = state.ssao
    // order of cases here is specific, not good code >:(
    switch(state.ssao) {
      case "enabled":
        scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
            "ssao",
            camera
          );
      scene.postProcessRenderPipelineManager.enableEffectInPipeline(
        "ssao",
        ssao.SSAOCombineRenderEffect,
        camera
      );
        break;
      case "ssao-only":
      scene.postProcessRenderPipelineManager.disableEffectInPipeline(
        "ssao",
        ssao.SSAOCombineRenderEffect,
        camera
      );
        break;
      case "disabled":
        scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(
          "ssao",
          camera
        );
        break;
    }
  })

  eventsObservable.add((event) => {
    if(event === "toggle-ssao-blur") {
      ssao.bypassBlur = !ssao.bypassBlur
    }
  })
  
  console.log("initialised babylonjs!")
};
