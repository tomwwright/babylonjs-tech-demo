import { Observable } from "@babylonjs/core"
import { Event } from "./Events"
import { CameraController } from "./CameraController"
import { SceneRendering } from "./SceneRendering"

export class GridResizeObserver {
  constructor(
    events: Observable<Event>,
    cameraController: CameraController,
    rendering: SceneRendering,
  ) {
    events.add(({ event, payload }) => {
      if (event === "onGridResize") {
        const sceneSize =
          (Math.max(payload.maxX, payload.maxZ) +
            cameraController.maxVisibleSurroundingDistance) *
          2
        rendering.resize(sceneSize)
        cameraController.setBounds(payload.maxX, payload.maxZ)
      }
    })
  }
}
