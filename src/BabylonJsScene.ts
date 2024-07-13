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
import { HexagonMarkerController } from "./HexagonMarkerController"

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

  const markers = new HexagonMarkerController(scene, eventsObservable)

  eventsObservable.add(({ event, payload }) => {
    if (event == "onHexagonHighlight") {
      setCursor({
        active: payload !== null,
        mapX: payload?.x,
        mapZ: payload?.z,
        label: payload?.label,
      })
    }
  })

  const cameraController = new CameraController(
    camera,
    eventsObservable,
    markers.maxX,
    markers.maxZ,
  )

  const rendering = new SceneRendering(
    scene,
    camera,
    stateObservable,
    markers.maxX,
    markers.maxZ,
    cameraController.cameraAngleDegrees,
    cameraController.maxCameraDistance,
  )

  // load assets

  const loader = new MapLoader(scene, eventsObservable)

  const loadAssets = async () => {
    await loader.loadAssets()
    await loader.load(
      "/map.txt",
      markers.hexagons,
      markers.mapSize,
      rendering.mirrorTexture,
      rendering.shadowGenerator,
    )
    setTimeout(() => {
      loader.load(
        "/map2.txt",
        markers.hexagons,
        markers.mapSize,
        rendering.mirrorTexture,
        rendering.shadowGenerator,
      )
    }, 4000)
  }
  loadAssets()

  console.log("initialised babylonjs!")
}
