import { useSceneState } from "../SceneState";

export const ToggleSSAOBlurButton = () => {
  const { ssaoBlurEnabled, setState } = useSceneState();

  const toggle = () => {
    setState({
      ssaoBlurEnabled: !ssaoBlurEnabled,
    });
  };

  return (
    <button style={{ pointerEvents: "auto" }} onClick={toggle}>
      SSAO Blur ({ssaoBlurEnabled ? "on" : "off"})
    </button>
  );
};
