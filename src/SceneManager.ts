import "@babylonjs/core/Debug/debugLayer"
import "@babylonjs/inspector"
import { Observable, ArcRotateCamera, Scene } from "@babylonjs/core"
import { CursorState, useCursor } from "./Cursor"
import { SceneState, useSceneState } from "./SceneState"
import { useEffect, useRef } from "react"
import { useBabylonJs } from "./BabylonJsProvider"
import { Event } from "./Events"
import { MapLoader } from "./MapLoader"
import { CameraController } from "./CameraController"
import { SceneRendering } from "./SceneRendering"
import { HexagonGridController } from "./HexagonGridController"
import { CursorGridLabelObserver } from "./CursorGridLabelObserver"
import { FpsObserver } from "./FpsObserver"
import { GridResizeObserver } from "./GridResizeObserver"

export const SceneManagerComponent = () => {
  const { scene, camera } = useBabylonJs()

  const { setCursor } = useCursor()
  const { stateObservable, eventsObservable, setState } = useSceneState()

  const initialised = useRef(false)

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true

      const sceneManager = new SceneManager(
        scene,
        camera,
        stateObservable,
        eventsObservable,
        setCursor,
      )
      setState({
        sceneManager,
      })
    }
  }, [scene, camera, stateObservable, eventsObservable, setCursor])

  return null
}

export class SceneManager {
  public readonly cameraController: CameraController
  public readonly grid: HexagonGridController
  public readonly loader: MapLoader

  constructor(
    public readonly scene: Scene,
    public readonly camera: ArcRotateCamera,
    stateObservable: Observable<SceneState>,
    eventsObservable: Observable<Event>,
    setCursor: (updates: Partial<CursorState>) => void,
  ) {
    const cameraController = new CameraController(camera, eventsObservable)
    const rendering = new SceneRendering(scene, camera, stateObservable)
    const grid = new HexagonGridController(scene, eventsObservable)
    const loader = new MapLoader(scene, eventsObservable, grid, rendering)

    new FpsObserver(scene, eventsObservable)
    new CursorGridLabelObserver(eventsObservable, setCursor)
    new GridResizeObserver(eventsObservable, cameraController, rendering)

    this.cameraController = cameraController
    this.grid = grid
    this.loader = loader

    // trigger async loading of assets and a default map
    const initialise = async () => {
      await loader.loadAssets()
      await loader.load("/map-small.txt")
    }
    initialise()
  }
}
