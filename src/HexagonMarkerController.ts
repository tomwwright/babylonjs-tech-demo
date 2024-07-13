import {
  ActionManager,
  Color3,
  ExecuteCodeAction,
  Mesh,
  MeshBuilder,
  Nullable,
  Observable,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core"
import { Event } from "./Events"
import { MapData } from "./MapData"

export class HexagonMarkerController {
  public readonly hexagons: Mesh[][]
  private mapData: Nullable<MapData> = null

  public readonly radius = 1
  public readonly spacing = 1.01
  public readonly spacingX = this.radius * this.spacing * 1.5
  public readonly spacingZ = this.radius * this.spacing * Math.sqrt(3)
  public readonly mapSize = 8
  public readonly maxX = this.mapSize * this.spacingX
  public readonly maxZ = this.mapSize * this.spacingZ

  constructor(
    scene: Scene,
    private readonly events: Observable<Event>,
  ) {
    // listen for map changes

    events.add(({ event, payload }) => {
      if (event === "onMapLoaded") {
        this.mapData = payload
      }
    })

    // create hexagons

    const { radius, spacingX, spacingZ, mapSize } = this

    const template = MeshBuilder.CreateCylinder(
      "hexagon",
      { tessellation: 6, height: 1, diameter: radius * 2 },
      scene,
    )
    const hexagonMaterial = new StandardMaterial("hexagon", scene)
    hexagonMaterial.specularColor = Color3.Black()
    hexagonMaterial.diffuseColor = Color3.Black()
    hexagonMaterial.alpha = 0
    const highlightColor = Color3.White()

    this.hexagons = []

    const onPointerOverHexagon = (x: number, z: number) => {
      for (let i = 0; i < mapSize; ++i) {
        this.setColorAndAlphaAtPosition(x, i, highlightColor, 0.05)
        this.setColorAndAlphaAtPosition(i, z, highlightColor, 0.05)
      }
      this.setColorAndAlphaAtPosition(x, z, Color3.Green(), 0.05)
    }

    const onPointerOutHexagon = (x: number, z: number) => {
      for (let i = 0; i < mapSize; ++i) {
        this.resetColorAndAlphaAtPosition(x, i)
        this.resetColorAndAlphaAtPosition(i, z)
      }
    }

    for (let x = 0; x < mapSize; ++x) {
      const row: Mesh[] = []
      this.hexagons.push(row)
      for (let z = 0; z < mapSize; ++z) {
        const hexagon = template.clone()
        hexagon.material = hexagonMaterial.clone(`hexagon${x}${z}`)
        const offsetZ = (x % 2) * spacingZ * 0.5
        hexagon.position = new Vector3(
          x * spacingX,
          0.5,
          z * spacingZ + offsetZ,
        )

        hexagon.actionManager = new ActionManager(scene)

        hexagon.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () =>
            onPointerOverHexagon(x, z),
          ),
        )

        const { onPointerOver, onPointerOut } = this.makeOnPointerHooks(x, z)

        hexagon.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPointerOverTrigger,
            onPointerOver,
          ),
        )

        hexagon.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () =>
            onPointerOutHexagon(x, z),
          ),
        )

        hexagon.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPointerOutTrigger,
            onPointerOut,
          ),
        )

        row.push(hexagon)
      }
    }

    template.dispose()
  }

  private setColorAndAlphaAtPosition(
    x: number,
    z: number,
    color: Color3,
    alpha: number,
  ) {
    const material = this.hexagons[x][z].material as StandardMaterial
    material.alpha = alpha
    material.diffuseColor = color
  }

  private resetColorAndAlphaAtPosition(x: number, z: number) {
    this.setColorAndAlphaAtPosition(x, z, Color3.BlackReadOnly, 0)
  }

  private makeOnPointerHooks = (x: number, z: number) => {
    const onPointerOver = () => {
      let label: string | undefined = undefined
      if (this.mapData) {
        label = this.mapData.spaces[x][z]
        label = `${label.charAt(0).toUpperCase()}${label.substring(1)}`
      }

      console.log("pointer over")
      this.events.notifyObservers({
        event: "onHexagonHighlight",
        payload: {
          x,
          z,
          label,
        },
      })
    }

    const onPointerOut = () => {
      this.events.notifyObservers({
        event: "onHexagonHighlight",
        payload: null,
      })
    }

    return {
      onPointerOver,
      onPointerOut,
    }
  }
}
