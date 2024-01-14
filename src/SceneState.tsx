import { Observable } from "@babylonjs/core";
import * as React from "react";

export interface SceneState {
  isOn: boolean;
}

interface SceneContext extends SceneState {
  observable: Observable<SceneState>;
  setState: (state: SceneState) => void;
}

const defaultState = {
  isOn: true,
} satisfies SceneState;

const SceneContext = React.createContext<SceneContext>({
  ...defaultState,
  observable: new Observable(),
  setState: () => {},
});

export const useSceneState = () => React.useContext(SceneContext);

export const SceneStateProvider = ({ children }: React.PropsWithChildren) => {
  const [observable] = React.useState<Observable<SceneState>>(new Observable());
  const [state, setReactState] = React.useState<SceneState>(defaultState);

  const setState = (state: SceneState) => {
    observable.notifyObservers(state);
    setReactState(state);
  };

  return (
    <SceneContext.Provider value={{ ...state, observable, setState }}>
      {children}
    </SceneContext.Provider>
  );
};
