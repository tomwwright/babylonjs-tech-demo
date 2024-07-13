import { useSceneState } from "../SceneState"

export const ToggleReflectionsButton = () => {
  const { reflectionsEnabled, setState } = useSceneState()

  const toggleOnOff = () => {
    setState({
      reflectionsEnabled: !reflectionsEnabled,
    })
  }

  return (
    <button style={{ pointerEvents: "auto" }} onClick={toggleOnOff}>
      Reflections ({reflectionsEnabled ? "on" : "off"})
    </button>
  )
}
