import {
  ActionManager,
  Color3,
  ExecuteCodeAction,
  Mesh,
  MeshBuilder,
  Observable,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core"
import { Event } from "./Events"

export class HexagonGridController {
  public grid: Mesh[][] = []

  public readonly radius = 1
  public readonly spacing = 1.01
  public readonly spacingX = this.radius * this.spacing * 1.5
  public readonly spacingZ = this.radius * this.spacing * Math.sqrt(3)
  public maxX = this.mapSize * this.spacingX
  public maxZ = this.mapSize * this.spacingZ

  constructor(
    private readonly scene: Scene,
    private readonly events: Observable<Event>,
    public mapSize = 0,
  ) {
    this.setSize(mapSize)
  }

  public setSize(size: number) {
    this.dispose()

    this.mapSize = size
    this.maxX = this.mapSize * this.spacingX
    this.maxZ = this.mapSize * this.spacingZ
    if (this.mapSize > 0) {
      this.createGrid()
      this.events.notifyObservers({
        event: "onGridResize",
        payload: {
          maxX: this.maxX,
          maxZ: this.maxZ,
        },
      })
    }
  }

  private dispose() {
    if (this.grid) {
      for (const row of this.grid) {
        for (const cell of row) {
          cell.dispose()
        }
      }
    }
  }

  private createGrid() {
    const { radius, spacingX, spacingZ, mapSize } = this

    const template = MeshBuilder.CreateCylinder(
      "hexagon",
      { tessellation: 6, height: 1, diameter: radius * 2 },
      this.scene,
    )
    const hexagonMaterial = new StandardMaterial("hexagon", this.scene)
    hexagonMaterial.specularColor = Color3.Black()
    hexagonMaterial.diffuseColor = Color3.Black()
    hexagonMaterial.alpha = 0

    this.grid = []

    for (let x = 0; x < mapSize; ++x) {
      const row: Mesh[] = []
      this.grid.push(row)
      for (let z = 0; z < mapSize; ++z) {
        const hexagon = template.clone()
        hexagon.material = hexagonMaterial.clone(`hexagon${x}${z}`)
        const offsetZ = (x % 2) * spacingZ * 0.5
        hexagon.position = new Vector3(
          x * spacingX,
          0.5,
          z * spacingZ + offsetZ,
        )

        hexagon.actionManager = new ActionManager(this.scene)

        const { onPointerOver, onPointerOut } = this.makeOnPointerHooks(x, z)

        hexagon.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPointerOverTrigger,
            onPointerOver,
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
    const material = this.grid[x][z].material as StandardMaterial
    material.alpha = alpha
    material.diffuseColor = color
  }

  private resetColorAndAlphaAtPosition(x: number, z: number) {
    this.setColorAndAlphaAtPosition(x, z, Color3.BlackReadOnly, 0)
  }

  private makeOnPointerHooks = (x: number, z: number) => {
    const highlightColor = Color3.White()

    const setHighlight = (x: number, z: number) => {
      for (let i = 0; i < this.mapSize; ++i) {
        this.setColorAndAlphaAtPosition(x, i, highlightColor, 0.05)
        this.setColorAndAlphaAtPosition(i, z, highlightColor, 0.05)
      }
      this.setColorAndAlphaAtPosition(x, z, Color3.Green(), 0.05)
    }

    const unsetHighlight = (x: number, z: number) => {
      for (let i = 0; i < this.mapSize; ++i) {
        this.resetColorAndAlphaAtPosition(x, i)
        this.resetColorAndAlphaAtPosition(i, z)
      }
    }

    const onPointerOver = () => {
      setHighlight(x, z)

      this.events.notifyObservers({
        event: "onGridHighlight",
        payload: {
          x,
          z,
        },
      })
    }

    const onPointerOut = () => {
      unsetHighlight(x, z)
      this.events.notifyObservers({
        event: "onGridHighlight",
        payload: null,
      })
    }

    return {
      onPointerOver,
      onPointerOut,
    }
  }
}
