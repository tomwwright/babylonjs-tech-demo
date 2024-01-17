import {
  ActionManager,
  ArcRotateCamera,
  Engine,
  Scene,
  Vector3,
} from "@babylonjs/core";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

export interface BabylonJsContext {
  canvas: HTMLCanvasElement;
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
}

const BabylonJsContext = React.createContext<BabylonJsContext>(
  {} as BabylonJsContext
);

export const useBabylonJs = () => React.useContext(BabylonJsContext);

export const BabylonJsProvider = ({ children }: React.PropsWithChildren) => {
  const ref = useRef<HTMLCanvasElement>(null);

  const [context, setContext] = useState<BabylonJsContext | undefined>();

  useEffect(() => {
    const canvas = ref.current;
    console.log("canvas", canvas);
    if (!canvas) {
      console.error("Unable to locate canvas to initialise BabylonJS");
      return;
    }

    const initialisedContext = initialiseBabylonJs(canvas);
    setContext(initialisedContext);

    return () => {
      console.log("Cleaning up BabylonJS engine...");
      initialisedContext.engine.dispose();
    };
  }, [ref]);

  return (
    <>
      <BabylonJsCanvas canvasRef={ref} />
      {context && (
        <BabylonJsContext.Provider value={context}>
          {children}
        </BabylonJsContext.Provider>
      )}
    </>
  );
};

type BabylonJsCanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

export const BabylonJsCanvas = ({ canvasRef }: BabylonJsCanvasProps) => (
  <canvas
    ref={canvasRef}
    style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      zIndex: -1,
    }}
  />
);

const initialiseBabylonJs = (canvas: HTMLCanvasElement) => {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  scene.actionManager = new ActionManager();

  const camera: ArcRotateCamera = new ArcRotateCamera(
    "Camera",
    Math.PI / 2,
    Math.PI / 2,
    2,
    Vector3.Zero(),
    scene
  );

  window.addEventListener("keydown", (ev) => {
    // Shift+Ctrl+Alt+I
    if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
      if (scene.debugLayer.isVisible()) {
        scene.debugLayer.hide();
      } else {
        scene.debugLayer.show();
      }
    }
  });

  engine.runRenderLoop(() => {
    scene.render();
  });

  return {
    canvas,
    engine,
    scene,
    camera,
  };
};
