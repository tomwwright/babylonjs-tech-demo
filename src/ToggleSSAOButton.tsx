import { SceneState, useSceneState } from "./SceneState";

export const ToggleSSAOButton = () => {
  const state = useSceneState();

  const toggle = () => {
    const ssaoStates: SceneState["ssao"][] = ["enabled", "ssao-only", "disabled"]
    const ssao = ssaoStates[(ssaoStates.findIndex(s => s === state.ssao) +1) % ssaoStates.length]
    state.setState({
      ...state,
      ssao,
    });
  };

  return (
    <button style={{pointerEvents: "auto"}} onClick={toggle}>SSAO: {state.ssao}</button>
  );
};
