import { useSceneState } from "../SceneState"

export const ToggleShadowsButton = () => {
  const { shadowsEnabled, setState } = useSceneState()

  const toggle = () => {
    setState({
      shadowsEnabled: !shadowsEnabled,
    })
  }

  return (
    <button style={{ pointerEvents: "auto" }} onClick={toggle}>
      Shadows ({shadowsEnabled ? "on" : "off"})
    </button>
  )
}
