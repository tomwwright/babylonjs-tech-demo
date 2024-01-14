import { BablylonJs } from "./BabylonJs";
import { CursorProvider } from "./Cursor";
import { Tooltip } from "./Tooltip";
import { SceneStateProvider } from "./SceneState";
import { ToggleButton } from "./ToggleButton";
import { BabylonJsProvider } from "./BabylonJsProvider";

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
              </div>
              <div style={{ width: "100px", backgroundColor: "red" }}></div>
            </div>

            <div
              id="footer"
              style={{
                height: "50px",
                backgroundColor: "green",
              }}
            />
          </div>
          <BablylonJs />
        </SceneStateProvider>
        <Tooltip />
      </CursorProvider>
    </BabylonJsProvider>
  );
}

export default App;
