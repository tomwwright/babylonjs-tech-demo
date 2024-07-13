import "@babylonjs/core/Debug/debugLayer"
import "@babylonjs/inspector"
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
  DirectionalLight,
  CascadedShadowGenerator,
  SSAO2RenderingPipeline,
  DefaultRenderingPipeline,
  DepthOfFieldEffectBlurLevel,
  MirrorTexture,
  Plane,
  RenderTargetTexture,
  ArcRotateCamera,
  Scene,
} from "@babylonjs/core"
import { CursorState, useCursor } from "./Cursor"
import { SceneState, useSceneState } from "./SceneState"
import { useEffect, useRef } from "react"
import { useBabylonJs } from "./BabylonJsProvider"
import { MapData } from "./MapData"
import { Event } from "./Events"
import { MapLoader } from "./MapLoader"
import { CameraController } from "./CameraController"

export const BablylonJsScene = () => {
  const { scene, camera } = useBabylonJs()

  const { setCursor } = useCursor()
  const { stateObservable, eventsObservable, sendEvent } = useSceneState()

  const initialised = useRef(false)

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true

      initialiseScene({
        setCursor,
        sendEvent,
        stateObservable,
        eventsObservable,
        scene,
        camera,
      })
    }
  }, [scene, camera, stateObservable, eventsObservable, setCursor])

  return null
}

interface InitialiseSceneProps {
  setCursor: (cursor: Partial<CursorState>) => void
  sendEvent: (event: Event) => void
  stateObservable: Observable<SceneState>
  eventsObservable: Observable<Event>
  camera: ArcRotateCamera
  scene: Scene
}

export const initialiseScene = ({
  setCursor,
  sendEvent,
  stateObservable,
  eventsObservable,
  camera,
  scene,
}: InitialiseSceneProps) => {
  // reporting fps

  let fpsSamples: number[] = []
  setInterval(() => {
    fpsSamples.push(scene.getEngine().getFps())
    if (fpsSamples.length > 5) {
      const fps = fpsSamples.reduce((sum, i) => sum + i, 0) / fpsSamples.length
      sendEvent({
        event: "onRenderStats",
        payload: {
          fps,
        },
      })
      fpsSamples = []
    }
  }, 500)

  // hovering for tooltip

  const makeOnPointerHooks = (x: number, z: number) => {
    let mapData: Nullable<MapData> = null
    eventsObservable.add(({ event, payload }) => {
      if (event === "onMapLoaded") {
        mapData = payload
      }
    })

    const onPointerOver = () => {
      let label: string | undefined = undefined
      if (mapData) {
        label = mapData.spaces[x][z]
        label = `${label.charAt(0).toUpperCase()}${label.substring(1)}`
      }
      setCursor({
        active: true,
        mapX: x,
        mapZ: z,
        label,
      })
    }

    const onPointerOut = () => {
      setCursor({
        active: false,
        mapX: undefined,
        mapZ: undefined,
        label: undefined,
      })
    }

    return {
      onPointerOver,
      onPointerOut,
    }
  }

  // set up lighting

  const light = new DirectionalLight(
    "light",
    new Vector3(1, -1, 1).normalize(),
    scene,
  )
  light.autoUpdateExtends = true
  light.autoCalcShadowZBounds = true
  const amblientLight = new HemisphericLight(
    "ambient",
    new Vector3(1, 1, 0),
    scene,
  )

  // configure shadows

  const shadowGenerator = new CascadedShadowGenerator(1024, light)
  shadowGenerator.autoCalcDepthBounds = false
  shadowGenerator.bias = 0.01
  shadowGenerator.numCascades = 2
  shadowGenerator.usePercentageCloserFiltering = true
  shadowGenerator.depthClamp = false
  shadowGenerator.shadowMaxZ = 60

  stateObservable.add(({ shadowsEnabled }) => {
    light.shadowEnabled = shadowsEnabled
  })

  // set up map of hexagons

  const radius = 1
  const spacing = 1.01
  const spacingX = radius * spacing * 1.5
  const spacingZ = radius * spacing * Math.sqrt(3)

  const template = MeshBuilder.CreateCylinder(
    "hexagon",
    { tessellation: 6, height: 1, diameter: radius * 2 },
    scene,
  )
  const hexagonMaterial = new StandardMaterial("hexagon", scene)
  hexagonMaterial.specularColor = Color3.Black()
  hexagonMaterial.diffuseColor = Color3.Black()
  hexagonMaterial.alpha = 0
  const highlightColor = Color3.White()
  const mapSize = 8
  const map: Mesh[][] = []

  const setColorAndAlphaAtPosition = (
    x: number,
    z: number,
    color: Color3,
    alpha: number,
  ) => {
    const material = map[x][z].material as StandardMaterial
    material.alpha = alpha
    material.diffuseColor = color
  }

  const resetColorAndAlphaAtPosition = (x: number, z: number) =>
    setColorAndAlphaAtPosition(x, z, hexagonMaterial.emissiveColor, 0)

  const onPointerOverHexagon = (x: number, z: number) => {
    for (let i = 0; i < mapSize; ++i) {
      setColorAndAlphaAtPosition(x, i, highlightColor, 0.05)
      setColorAndAlphaAtPosition(i, z, highlightColor, 0.05)
    }
    setColorAndAlphaAtPosition(x, z, Color3.Green(), 0.05)
  }

  const onPointerOutHexagon = (x: number, z: number) => {
    for (let i = 0; i < mapSize; ++i) {
      resetColorAndAlphaAtPosition(x, i)
      resetColorAndAlphaAtPosition(i, z)
    }
  }

  for (let x = 0; x < mapSize; ++x) {
    const row: Mesh[] = []
    map.push(row)
    for (let z = 0; z < mapSize; ++z) {
      const hexagon = template.clone()
      hexagon.material = hexagonMaterial.clone(`hexagon${x}${z}`)
      const offsetZ = (x % 2) * spacingZ * 0.5
      hexagon.position = new Vector3(x * spacingX, 0.5, z * spacingZ + offsetZ)

      hexagon.actionManager = new ActionManager(scene)

      hexagon.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () =>
          onPointerOverHexagon(x, z),
        ),
      )

      const { onPointerOver, onPointerOut } = makeOnPointerHooks(x, z)

      hexagon.actionManager.registerAction(
        new ExecuteCodeAction(
          ActionManager.OnPointerOverTrigger,
          onPointerOver,
        ),
      )

      hexagon.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () =>
          onPointerOutHexagon(x, z),
        ),
      )

      hexagon.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, onPointerOut),
      )

      row.push(hexagon)
    }
  }

  scene.removeMesh(template)
  template.dispose()

  // configure camera controls

  const maxX = mapSize * spacingX
  const maxZ = mapSize * spacingZ

  const cameraController = new CameraController(
    camera,
    eventsObservable,
    maxX,
    maxZ,
  )

  // reflective ground

  const skybox = MeshBuilder.CreateBox("skybox", { size: 50 }, scene)
  skybox.position = new Vector3(maxX / 2, -2, maxZ / 2)
  const skyboxMaterial = new StandardMaterial("skybox", scene)
  skyboxMaterial.emissiveColor = new Color3(0.3, 0.3, 0.7)
  skyboxMaterial.backFaceCulling = false
  skyboxMaterial.disableLighting = true
  skybox.material = skyboxMaterial

  // sin(A) = perp / hyp
  const visibleSurroundingDistance =
    Math.sin(cameraController.cameraAngleDegrees) *
    cameraController.maxCameraDistance *
    2.25

  const width = maxX + 2 * visibleSurroundingDistance
  const height = maxZ + 2 * visibleSurroundingDistance

  const ground = MeshBuilder.CreateGround("ground", { width, height })
  ground.position = new Vector3(maxX / 2, 0.1, maxZ / 2)
  ground.receiveShadows = true
  const groundMaterial = new StandardMaterial("ground")
  const mirrorTexture = new MirrorTexture("mirror", { ratio: 0.5 }, scene)
  mirrorTexture.mirrorPlane = Plane.FromPositionAndNormal(
    ground.position,
    ground.getFacetNormal(0).scale(-1),
  )
  mirrorTexture.renderList = [skybox]
  mirrorTexture.adaptiveBlurKernel = 24
  mirrorTexture.noPrePassRenderer = true

  groundMaterial.reflectionTexture = mirrorTexture
  groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.3)
  groundMaterial.specularColor = new Color3(0.2, 0.2, 0.3)
  ground.material = groundMaterial

  amblientLight.excludedMeshes.push(ground)

  stateObservable.add((state) => {
    if (state.scalingLevel === scene.getEngine().getHardwareScalingLevel()) {
      return
    }
    scene.getEngine().setHardwareScalingLevel(state.scalingLevel)
  })

  // demo reacting to state changes from react

  stateObservable.add((state) => {
    if (state.reflectionsEnabled) {
      groundMaterial.reflectionTexture = mirrorTexture
      mirrorTexture.refreshRate =
        RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME
      groundMaterial.emissiveColor = Color3.BlackReadOnly
    } else {
      groundMaterial.reflectionTexture = null
      mirrorTexture.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE
      groundMaterial.emissiveColor = new Color3(0.3, 0.3, 0.7)
    }
  })

  // load assets

  const loader = new MapLoader(scene, eventsObservable)

  const loadAssets = async () => {
    await loader.loadAssets()
    await loader.load("/map.txt", map, mapSize, mirrorTexture, shadowGenerator)
    setTimeout(() => {
      loader.load("/map2.txt", map, mapSize, mirrorTexture, shadowGenerator)
    }, 4000)
  }
  loadAssets()

  // set up rendering

  const renderer = new DefaultRenderingPipeline("renderer", true, scene, [
    camera,
  ])

  // anti aliasing

  renderer.fxaaEnabled = true

  // depth of field

  renderer.depthOfFieldEnabled = true
  renderer.depthOfField.fStop = 1.2
  renderer.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.High

  const setCameraFocalLength = () => {
    renderer.depthOfField.focusDistance = camera.radius * 1000
  }

  scene.actionManager.registerAction(
    new ExecuteCodeAction(
      ActionManager.OnEveryFrameTrigger,
      setCameraFocalLength,
    ),
  )

  // ambient occlusion

  const ssao = new SSAO2RenderingPipeline("ssao", scene, 1)
  ssao.samples = 16
  ssao.bilateralSoften = 0.1
  ssao.totalStrength = 1.0
  ssao.radius = 0.5

  scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
    "ssao",
    camera,
  )

  // SSAO debugging

  let currentSSAO: SceneState["ssao"] = "on"
  stateObservable.add((state) => {
    if (state.ssao === currentSSAO) {
      return
    }
    currentSSAO = state.ssao
    // order of cases here is specific, not good code >:(
    switch (state.ssao) {
      case "on":
        scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
          "ssao",
          camera,
        )
        scene.postProcessRenderPipelineManager.enableEffectInPipeline(
          "ssao",
          ssao.SSAOCombineRenderEffect,
          camera,
        )
        break
      case "only":
        scene.postProcessRenderPipelineManager.disableEffectInPipeline(
          "ssao",
          ssao.SSAOCombineRenderEffect,
          camera,
        )
        break
      case "off":
        scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(
          "ssao",
          camera,
        )
        break
    }
  })

  stateObservable.add(({ ssaoBlurEnabled }) => {
    ssao.bypassBlur = !ssaoBlurEnabled
  })

  console.log("initialised babylonjs!")
}
