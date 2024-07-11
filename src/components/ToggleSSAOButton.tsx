import { SceneState, useSceneState } from "../SceneState";

export const ToggleSSAOButton = () => {
  const { ssao, setState } = useSceneState();

  const toggle = () => {
    const ssaoStates: SceneState["ssao"][] = ["on", "only", "off"];
    const nextSsao =
      ssaoStates[
        (ssaoStates.findIndex((s) => s === ssao) + 1) % ssaoStates.length
      ];
    setState({
      ssao: nextSsao,
    });
  };

  return (
    <button style={{ pointerEvents: "auto" }} onClick={toggle}>
      SSAO ({ssao})
    </button>
  );
};
