import { PropsWithChildren } from "react"
import { useSceneState } from "../SceneState"
import { Event } from "../Events"

interface Props extends PropsWithChildren {
  event: Event
}
export const EventButton = ({ event, children }: Props) => {
  const state = useSceneState()

  return (
    <button
      style={{ pointerEvents: "auto" }}
      onClick={() => state.sendEvent(event)}
    >
      {children}
    </button>
  )
}
