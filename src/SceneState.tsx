import { Observable } from "@babylonjs/core";
import * as React from "react";

export interface SceneState {
  ssao: "enabled" | "disabled" | "ssao-only"
  isOn: boolean;
}

interface SceneContext extends SceneState {
  stateObservable: Observable<SceneState>;
  eventsObservable: Observable<string>;
  setState: (state: SceneState) => void;
  sendEvent: (event: string) => void;
}

const defaultState = {
  ssao: "enabled",
  isOn: true,
} satisfies SceneState;

const SceneContext = React.createContext<SceneContext>({
  ...defaultState,
  stateObservable: new Observable(),
  eventsObservable: new Observable(),
  setState: () => {},
  sendEvent: () => {},
});

export const useSceneState = () => React.useContext(SceneContext);

export const SceneStateProvider = ({ children }: React.PropsWithChildren) => {
  const [stateObservable] = React.useState<Observable<SceneState>>(
    new Observable()
  );
  const [eventsObservable] = React.useState<Observable<string>>(
    new Observable()
  );
  const [state, setReactState] = React.useState<SceneState>(defaultState);

  const setState = (state: SceneState) => {
    stateObservable.notifyObservers(state);
    setReactState(state);
  };

  const sendEvent = (event: string) => {
    eventsObservable.notifyObservers(event);
  };

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
  );
};
