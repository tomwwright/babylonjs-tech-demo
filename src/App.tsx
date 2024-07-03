import { BablylonJs } from "./BabylonJs";
import { CursorProvider } from "./Cursor";
import { Tooltip } from "./Tooltip";
import { SceneStateProvider } from "./SceneState";
import { ToggleButton } from "./ToggleButton";
import { BabylonJsProvider } from "./BabylonJsProvider";
import { EventButton } from "./EventButton";
import { ToggleSSAOButton } from "./ToggleSSAOButton";
import { FpsCounter } from "./FpsCounter";

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
                backgroundColor: "green",
              }}
            />

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
                  width: "100px",
                  backgroundColor: "red",
                  pointerEvents: "auto",
                }}
              >
                <ToggleButton />
                <EventButton event="rotate-left">Rotate left</EventButton>
                <EventButton event="rotate-right">Rotate right</EventButton>
                <EventButton event="toggle-hardware-scaling-level">Cycle scaling</EventButton>
                <ToggleSSAOButton />
                <EventButton event="toggle-ssao-blur">Toggle SSAO blur</EventButton>
                <EventButton event="toggle-shadows">Toggle shadows</EventButton>
              </div>
              <div style={{ width: "100px", backgroundColor: "red" }}></div>
            </div>

            <div
              id="footer"
              style={{
                height: "50px",
                backgroundColor: "green",
              }}
            >
              <p><FpsCounter /></p>
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
