import { Observable } from "@babylonjs/core"
import { Event } from "./Events"
import { MapData } from "./MapData"
import { CursorState } from "./Cursor"

export class CursorGridLabelObserver {
  private mapData?: MapData

  constructor(
    events: Observable<Event>,
    setCursor: (updates: Partial<CursorState>) => void,
  ) {
    events.add(({ event, payload }) => {
      // listen for map changes
      if (event === "onMapLoaded") {
        this.mapData = payload
      }

      // update cursor with map label
      if (event === "onGridHighlight") {
        let label: string | undefined = undefined
        if (this.mapData && payload) {
          label = this.mapData.spaces[payload.x][payload.z]
          label = `${label.charAt(0).toUpperCase()}${label.substring(1)}`
        }

        setCursor({
          active: payload !== null,
          mapX: payload?.x,
          mapZ: payload?.z,
          label,
        })
      }
    })
  }
}
