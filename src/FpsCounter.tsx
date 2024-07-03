import { useState } from "react";
import { useSceneState } from "./SceneState";

export const FpsCounter = () => {
  const state = useSceneState();
  const [fps, setFps] = useState(0);

  state.eventsObservable.add((event) => {
    if(event.startsWith("report-fps")) {
      const fps = Number.parseFloat(event.split(";")[1])
      setFps(fps)
    }
  })

  return `FPS: ${fps.toFixed(1)}`
};
