import { useEffect } from "react";
import { initialiseBabylonJs } from "./BabylonJs";

function App() {
  return (
    <>
      <canvas
        id="babylonjs"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: -1,
        }}
      />
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
          <div style={{ width: "100px", backgroundColor: "red" }}></div>
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
    </>
  );
}

const BablylonJs = () => {
  useEffect(() => {
    initialiseBabylonJs();
  }, []);

  return null;
};

export default App;
