import { SceneState, useSceneState } from "../SceneState"

export const ToggleScalingLevelButton = () => {
  const { scalingLevel, setState } = useSceneState()

  const toggle = () => {
    const scalingLevels: SceneState["scalingLevel"][] = [1, 2, 4]
    const i = scalingLevels.findIndex((l) => l == scalingLevel)
    const nextScalingLevel = scalingLevels[(i + 1) % scalingLevels.length]
    setState({
      scalingLevel: nextScalingLevel,
    })
  }

  return (
    <button style={{ pointerEvents: "auto" }} onClick={toggle}>
      Resolution Scaling ({scalingLevel}x)
    </button>
  )
}
