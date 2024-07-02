import { useSceneState } from "./SceneState";

export const ToggleSSAOOnlyButton = () => {
  const state = useSceneState();

  const toggleOnOff = () => {
    state.setState({
      ...state,
      isSSAOOnly: !state.isSSAOOnly,
    });
  };

  return (
    <button onClick={toggleOnOff}>SSAO Only: {state.isSSAOOnly ? "OFF" : "ON"}</button>
  );
};
