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
  RenderTargetTexture,
} from "@babylonjs/core";
import { CursorState, useCursor } from "./Cursor";
import { SceneState, useSceneState } from "./SceneState";
import { useEffect, useRef } from "react";
import { BabylonJsContext, useBabylonJs } from "./BabylonJsProvider";
import { parseMapData } from "./MapData";

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

  const makeOnPointerHooks = (x: number, z: number) => {
    const updateCursor = (event: MouseEvent) => {
      setCursor({
        x: event.clientX,
        y: event.clientY,
        active: true,
        mapX: x,
        mapZ: z,
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
        mapX: undefined,
        mapZ: undefined
      });
    };

    return {
      onPointerOver,
      onPointerOut
    }
  }
  
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

  // configure shadows

  const shadowGenerator = new CascadedShadowGenerator(1024, light);
  shadowGenerator.autoCalcDepthBounds = false;
  shadowGenerator.bias = 0.01;
  shadowGenerator.numCascades = 2;
  shadowGenerator.usePercentageCloserFiltering = true;
  shadowGenerator.depthClamp = false;
  shadowGenerator.shadowMaxZ = 60;

  eventsObservable.add((event) => {
    if(event === "toggle-shadows") {
      light.shadowEnabled = !light.shadowEnabled;
    }
  })

  // set up map of hexagons

  const radius = 1;
  const spacing = 1.01;
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
  const mapSize = 8;
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
      setColorAndAlphaAtPosition(x, i, highlightColor, 0.05);
      setColorAndAlphaAtPosition(i, z, highlightColor, 0.05);
    }
    setColorAndAlphaAtPosition(x, z, Color3.Green(), 0.05);
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

      const {
        onPointerOver,
        onPointerOut
      } = makeOnPointerHooks(x, z)

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

  camera.maxZ = 60;

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

  const skybox = MeshBuilder.CreateBox("skybox", { size: 50 }, scene);
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
  ground.position = new Vector3(maxX / 2, 0.1, maxZ / 2);
  ground.receiveShadows = true;
  const groundMaterial = new StandardMaterial("ground");
  const mirrorTexture = new MirrorTexture("mirror", { ratio: 0.25 }, scene);
  mirrorTexture.mirrorPlane = Plane.FromPositionAndNormal(
    ground.position,
    ground.getFacetNormal(0).scale(-1)
  );
  mirrorTexture.renderList = [skybox];
  mirrorTexture.adaptiveBlurKernel = 64;
  mirrorTexture.noPrePassRenderer = true;

  groundMaterial.reflectionTexture = mirrorTexture;
  groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.3);
  groundMaterial.specularColor = new Color3(0.2, 0.2, 0.3);
  ground.material = groundMaterial;

  amblientLight.excludedMeshes.push(ground);

  stateObservable.add((state) => {
    if(state.scalingLevel === engine.getHardwareScalingLevel()) {
      return;
    }
    engine.setHardwareScalingLevel(state.scalingLevel)
  });

  // demo reacting to state changes from react

  stateObservable.add((state) => {
    console.log("from babylon", state);
    if (state.reflectionsEnabled) {
      groundMaterial.reflectionTexture = mirrorTexture
      mirrorTexture.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME
      groundMaterial.emissiveColor = Color3.BlackReadOnly
    } else {
      groundMaterial.reflectionTexture = null;
      mirrorTexture.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE
      groundMaterial.emissiveColor = new Color3(0.3, 0.3, 0.7);
    }
  });

  // load assets

  const loadAssets = async () => {
    const mapDataString = await Tools.LoadFileAsync("/map.txt", false)
    const mapData = parseMapData(mapDataString)

    const loadGlb = async (filename: string) => {
      const imported = await SceneLoader.ImportMeshAsync(
        "",
        filename,
        undefined,
        undefined,
        undefined,
        ".glb"
      )
  
      const mesh = imported.meshes.find(m => m.name === "__root__")
      if(mesh) {
        return mesh
      }
      throw new Error("No __root__ in loaded .glb") 
    }
    
    const meshes = {
      forest: await loadGlb("/grass-forest.glb"),
      grass: await loadGlb("/grass.glb"),
      sheep: await loadGlb("/building-sheep.glb"),
      farm: await loadGlb("/building-farm.glb"),
      village: await loadGlb("/building-village.glb"),
      rocks: await loadGlb("/water-rocks.glb"),
    }

    for(const mesh of Object.values(meshes)) {
      mesh.rotate(Vector3.Up(), Math.PI / 6);
      mesh.scalingDeterminant = 1.7;
      mesh.setEnabled(false)
    }
    
    // submerge the included water part of the tile
    meshes.rocks.position.y -= 0.1

    // populate spaces
    for (let x = 0; x < mapSize; ++x) {
      for (let z = 0; z < mapSize; ++z) {
        const hexagon = map[x][z];
        const mapDataSpace = mapData.spaces[x][z]
        if(mapDataSpace === "empty") {
          continue;
        }

        const mesh = meshes[mapDataSpace]

        const clone = mesh.clone(`${mapDataSpace}${x}${z}`, null);
        if (clone) {
          scene.addMesh(clone, true)
          clone.setEnabled(true)
          clone.receiveShadows = true;
          for (const child of clone.getChildMeshes()) {
            child.receiveShadows = true;
            mirrorTexture.renderList?.push(child);
          }

          shadowGenerator.addShadowCaster(clone, true);
          const rotation = Math.floor(6 * Math.random())
          clone.rotate(Vector3.UpReadOnly, rotation * Math.PI/3)

          clone.position = new Vector3(
            hexagon.position.x,
            clone.position.y,
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

  let currentSSAO: SceneState["ssao"] = "on"
  stateObservable.add((state) => {
    if(state.ssao === currentSSAO) {
      return
    }
    currentSSAO = state.ssao
    // order of cases here is specific, not good code >:(
    switch(state.ssao) {
      case "on":
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
      case "only":
      scene.postProcessRenderPipelineManager.disableEffectInPipeline(
        "ssao",
        ssao.SSAOCombineRenderEffect,
        camera
      );
        break;
      case "off":
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
