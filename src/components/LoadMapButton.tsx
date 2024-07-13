import { PropsWithChildren } from "react"
import { useSceneState } from "../SceneState"

type LoadMapButtonProps = {
  filename?: string
}
export const LoadMapButton = ({
  filename,
  children,
}: LoadMapButtonProps & PropsWithChildren) => {
  const { sceneManager } = useSceneState()

  const onClick = () => {
    if (sceneManager) {
      if (!filename) {
        sceneManager.loader.dispose()
        sceneManager.grid.setSize(1)
      } else {
        sceneManager.loader.load(filename)
      }
    }
  }

  return (
    <button style={{ pointerEvents: "auto" }} onClick={onClick}>
      {children}
    </button>
  )
}
