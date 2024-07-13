import { Observable, Scene } from "@babylonjs/core"
import { Event } from "./Events"

export class FpsObserver {
  constructor(scene: Scene, eventsObservable: Observable<Event>) {
    let fpsSamples: number[] = []

    const sampleFps = () => {
      fpsSamples.push(scene.getEngine().getFps())
      if (fpsSamples.length > 5) {
        const fps =
          fpsSamples.reduce((sum, i) => sum + i, 0) / fpsSamples.length
        eventsObservable.notifyObservers({
          event: "onRenderStats",
          payload: {
            fps,
          },
        })
        fpsSamples = []
      }
    }

    setInterval(() => sampleFps(), 500)
  }
}
