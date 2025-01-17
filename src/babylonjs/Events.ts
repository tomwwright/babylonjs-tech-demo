import { Nullable } from "@babylonjs/core"
import { MapData } from "./MapData"

export type Event =
  | RotateCameraEvent
  | OnMapLoadedEvent
  | OnRenderStatsEvent
  | OnGridHighlightEvent
  | OnGridResizeEvent

export type RotateCameraEvent = {
  event: "rotateCamera"
  payload: "left" | "right"
}

export type OnMapLoadedEvent = {
  event: "onMapLoaded"
  payload: MapData
}

export type OnRenderStatsEvent = {
  event: "onRenderStats"
  payload: {
    fps: number
  }
}

export type OnGridHighlightEvent = {
  event: "onGridHighlight"
  payload: Nullable<{
    x: number
    z: number
  }>
}

export type OnGridResizeEvent = {
  event: "onGridResize"
  payload: {
    maxX: number
    maxZ: number
  }
}
