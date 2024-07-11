import { useSceneState } from "../SceneState";

export const ToggleReflectionsButton = () => {
  const state = useSceneState();

  const toggleOnOff = () => {
    state.setState({
      ...state,
      reflectionsEnabled: !state.reflectionsEnabled,
    });
  };

  return (
    <button style={{ pointerEvents: "auto" }} onClick={toggleOnOff}>
      Reflections ({state.reflectionsEnabled ? "on" : "off"})
    </button>
  );
};
