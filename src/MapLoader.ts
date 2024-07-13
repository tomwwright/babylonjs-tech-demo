import {
  AbstractMesh,
  Mesh,
  MirrorTexture,
  Nullable,
  Observable,
  Scene,
  SceneLoader,
  ShadowGenerator,
  Tools,
  TransformNode,
  Vector3,
} from "@babylonjs/core"
import { MapData, parseMapData } from "./MapData"
import { Event } from "./Events"
import { HexagonGridController } from "./HexagonGridController"

type AssetMeshes = {
  forest: AbstractMesh
  grass: AbstractMesh
  sheep: AbstractMesh
  farm: AbstractMesh
  village: AbstractMesh
  rocks: AbstractMesh
}
export class MapLoader {
  private assetMeshes?: AssetMeshes
  private mapNode: Nullable<TransformNode> = null
  private loadingMap?: Promise<MapData>

  constructor(
    private scene: Scene,
    private events: Observable<Event>,
    private grid: HexagonGridController,
  ) {}

  public get isLoading(): boolean {
    return this.loadingMap !== undefined
  }

  public async loadAssets() {
    if (this.assetMeshes) {
      return
    }

    const loadGlb = async (filename: string) => {
      const imported = await SceneLoader.ImportMeshAsync(
        "",
        filename,
        undefined,
        undefined,
        undefined,
        ".glb",
      )

      const mesh = imported.meshes.find((m) => m.name === "__root__")
      if (mesh) {
        return mesh
      }
      throw new Error("No __root__ in loaded .glb")
    }

    const meshes = {
      forest: await loadGlb("/grass-forest.glb"),
      grass: await loadGlb("/grass.glb"),
      sheep: await loadGlb("/building-sheep.glb"),
      farm: await loadGlb("/building-farm.glb"),
      village: await loadGlb("/building-village.glb"),
      rocks: await loadGlb("/water-rocks.glb"),
    }

    // submerge the included water part of the tile
    meshes.rocks.position.y -= 0.1

    for (const mesh of Object.values(meshes)) {
      mesh.rotate(Vector3.Up(), Math.PI / 6)
      mesh.scalingDeterminant = 1.7
      mesh.setEnabled(false)
    }

    this.assetMeshes = meshes
  }

  public dispose() {
    if (this.mapNode) {
      this.mapNode.dispose()
    }
    this.mapNode = null
  }

  public async load(
    filename: string,
    mirrorTexture: MirrorTexture,
    shadowGenerator: ShadowGenerator,
  ) {
    if (this.isLoading) {
      throw new Error("Currently loading map")
    }

    this.loadingMap = this.loadMap(filename, mirrorTexture, shadowGenerator)
    const mapData = await this.loadingMap
    this.loadingMap = undefined
    this.events.notifyObservers({ event: "onMapLoaded", payload: mapData })
  }

  private async loadMap(
    filename: string,
    mirrorTexture: MirrorTexture,
    shadowGenerator: ShadowGenerator,
  ) {
    if (this.mapNode) {
      this.dispose()
    }

    if (!this.assetMeshes) {
      throw new Error("Asset meshes not yet loaded")
    }

    const mapData = parseMapData(await Tools.LoadFileAsync(filename, false))
    const mapSize = mapData.rows
    this.grid.setSize(mapData.rows)

    this.mapNode = new TransformNode("map")
    this.scene.addTransformNode(this.mapNode)
    for (let x = 0; x < mapSize; ++x) {
      for (let z = 0; z < mapSize; ++z) {
        const hexagon = this.grid.grid[x][z]
        const mapDataSpace = mapData.spaces[x][z]
        if (mapDataSpace === "empty") {
          continue
        }

        const mesh = this.assetMeshes[mapDataSpace]

        const clone = mesh.clone(`${mapDataSpace}${x}${z}`, null)
        if (clone) {
          clone.setParent(this.mapNode)
          clone.setEnabled(true)
          clone.receiveShadows = true
          for (const child of clone.getChildMeshes()) {
            child.receiveShadows = true
            mirrorTexture.renderList?.push(child)
          }

          shadowGenerator.addShadowCaster(clone, true)
          const rotation = Math.floor(6 * Math.random())
          clone.rotate(Vector3.UpReadOnly, (rotation * Math.PI) / 3)

          clone.position = new Vector3(
            hexagon.position.x,
            clone.position.y,
            hexagon.position.z,
          )
        }
      }
    }

    return mapData
  }
}
