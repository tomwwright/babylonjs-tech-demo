import { useSceneState } from "./SceneState";

export const ToggleButton = () => {
  const state = useSceneState();

  const toggleOnOff = () => {
    state.setState({
      ...state,
      isOn: !state.isOn,
    });
  };

  return (
    <button onClick={toggleOnOff}>Toggle: {state.isOn ? "OFF" : "ON"}</button>
  );
};