import { Observable } from "@babylonjs/core"
import * as React from "react"
import { useCallback } from "react"
import { Event } from "./Events"
import { TechDemoSceneManager } from "./TechDemoSceneManager"

export interface SceneState {
  ssao: "on" | "off" | "only"
  ssaoBlurEnabled: boolean
  reflectionsEnabled: boolean
  shadowsEnabled: boolean
  scalingLevel: 1 | 2 | 4
  sceneManager?: TechDemoSceneManager
}

interface SceneContext extends SceneState {
  stateObservable: Observable<SceneState>
  eventsObservable: Observable<Event>
  setState: (updates: Partial<SceneState>) => void
  sendEvent: (event: Event) => void
}

const defaultState = {
  ssao: "on",
  ssaoBlurEnabled: true,
  reflectionsEnabled: true,
  shadowsEnabled: true,
  scalingLevel: 1,
} satisfies SceneState

const SceneContext = React.createContext<SceneContext>({
  ...defaultState,
  stateObservable: new Observable(),
  eventsObservable: new Observable(),
  setState: () => {},
  sendEvent: () => {},
})

export const useSceneState = () => React.useContext(SceneContext)

export const SceneStateProvider = ({ children }: React.PropsWithChildren) => {
  const { current: stateObservable } = React.useRef(
    new Observable<SceneState>(),
  )
  const { current: eventsObservable } = React.useRef(new Observable<Event>())
  const [state, setReactState] = React.useState<SceneState>(defaultState)
  const stateRef = React.useRef(state)

  stateRef.current = state // always reference latest version of state in setState callback
  const setState = useCallback(
    (updates: Partial<SceneState>) => {
      const state = stateRef.current
      const updated = {
        ...state,
        ...updates,
      }
      stateObservable.notifyObservers(updated)
      setReactState(updated)
    },
    [setReactState],
  )

  const sendEvent = (event: Event) => {
    eventsObservable.notifyObservers(event)
  }

  return (
    <SceneContext.Provider
      value={{
        ...state,
        eventsObservable,
        stateObservable,
        setState,
        sendEvent,
      }}
    >
      {children}
    </SceneContext.Provider>
  )
}
