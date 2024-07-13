import "@babylonjs/core/Debug/debugLayer"
import "@babylonjs/inspector"
import {
  Vector3,
  MeshBuilder,
  ActionManager,
  Color3,
  StandardMaterial,
  ExecuteCodeAction,
  Observable,
  Nullable,
  Mesh,
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
import { SceneRendering } from "./SceneRendering"

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

  const rendering = new SceneRendering(
    scene,
    camera,
    stateObservable,
    maxX,
    maxZ,
    cameraController.cameraAngleDegrees,
    cameraController.maxCameraDistance,
  )

  // load assets

  const loader = new MapLoader(scene, eventsObservable)

  const loadAssets = async () => {
    await loader.loadAssets()
    await loader.load(
      "/map.txt",
      map,
      mapSize,
      rendering.mirrorTexture,
      rendering.shadowGenerator,
    )
    setTimeout(() => {
      loader.load(
        "/map2.txt",
        map,
        mapSize,
        rendering.mirrorTexture,
        rendering.shadowGenerator,
      )
    }, 4000)
  }
  loadAssets()

  console.log("initialised babylonjs!")
}
