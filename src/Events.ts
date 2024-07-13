import { MapData } from "./MapData"

export type Event = RotateCameraEvent | OnMapLoadedEvent | OnRenderStatsEvent

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
