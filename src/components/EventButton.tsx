import { PropsWithChildren } from "react";
import { useSceneState } from "../SceneState";

interface Props extends PropsWithChildren {
  event: string;
}
export const EventButton = ({ event, children }: Props) => {
  const state = useSceneState();

  return (
    <button
      style={{ pointerEvents: "auto" }}
      onClick={() => state.sendEvent(event)}
    >
      {children}
    </button>
  );
};
