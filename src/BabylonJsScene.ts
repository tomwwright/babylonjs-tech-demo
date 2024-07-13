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

  const cameraController = new CameraController(camera, eventsObservable)

  const grid = new HexagonGridController(scene, eventsObservable)
  new CursorGridLabelObserver(eventsObservable, setCursor)

  const rendering = new SceneRendering(scene, camera, stateObservable)

  // resize bounds on grid resizing

  eventsObservable.add(({ event, payload }) => {
    if (event === "onGridResize") {
      const sceneSize =
        (Math.max(payload.maxX, payload.maxZ) +
          cameraController.maxVisibleSurroundingDistance) *
        2
      rendering.resize(sceneSize)
    }
  })

  // load assets

  const loader = new MapLoader(scene, eventsObservable, grid)

  const loadAssets = async () => {
    await loader.loadAssets()
    await loader.load(
      "/map.txt",
      rendering.mirrorTexture,
      rendering.shadowGenerator,
    )
  }
  loadAssets()

  console.log("initialised babylonjs!")
}
