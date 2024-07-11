import { useState } from "react";
import { useSceneState } from "../SceneState";

export const FpsCounter = () => {
  const state = useSceneState();
  const [fps, setFps] = useState(0);

  state.eventsObservable.add(({ event, payload }) => {
    if (event === "onRenderStats") {
      setFps(payload.fps);
    }
  });

  return `FPS: ${fps.toFixed(1)}`;
};
