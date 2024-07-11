import { BablylonJs } from "./BabylonJs";
import { CursorProvider } from "./Cursor";
import { Tooltip } from "./Tooltip";
import { SceneStateProvider } from "./SceneState";
import { ToggleReflectionsButton } from "./ToggleReflectionsButton";
import { BabylonJsProvider } from "./BabylonJsProvider";
import { EventButton } from "./EventButton";
import { ToggleSSAOButton } from "./ToggleSSAOButton";
import { FpsCounter } from "./FpsCounter";
import { ToggleScalingLevelButton } from "./ToggleScalingLevelButton";
import { ToggleSSAOBlurButton } from "./ToggleSSAOBlurButton";
import { ToggleShadowsButton } from "./ToggleShadowsButton";

function App() {
  return (
    <BabylonJsProvider>
      <CursorProvider>
        <SceneStateProvider>
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              pointerEvents: "none",
            }}
          >
            <div
              id="header"
              style={{
                height: "50px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                padding: "4px 16px",
                alignContent: "center"
              }}
            >
              BabylonJS Tech Demo
              </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "stretch",
                flex: "auto",
              }}
            >
              <div
                style={{
                  width: "140px",
                  pointerEvents: "none",
                  padding: "8px 8px",
                  display: "flex",
                  flexDirection: "column-reverse",
                  gap: "8px"
                }}
              >
                <EventButton event="rotate-left">Rotate left</EventButton>
                <EventButton event="rotate-right">Rotate right</EventButton>
              </div>
              <div style={{
                width: "140px",
                pointerEvents: "none",
                padding: "8px 8px",
                display: "flex",
                flexDirection: "column-reverse",
                gap: "8px"
               }}>
                <ToggleReflectionsButton />
                <ToggleScalingLevelButton />
                <ToggleSSAOButton />
                <ToggleSSAOBlurButton />
                <ToggleShadowsButton />
               </div>
            </div>

            <div
              id="footer"
              style={{
                height: "50px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                padding: "4px 16px",
                alignContent: "center"
              }}
            >
              <FpsCounter />
            </div>
          </div>
          <BablylonJs />
        </SceneStateProvider>
        <Tooltip />
      </CursorProvider>
    </BabylonJsProvider>
  );
}

export default App;
