import { AbstractMesh, Mesh, MirrorTexture, Observable, Scene, SceneLoader, ShadowGenerator, Tools, Vector3 } from "@babylonjs/core";
import { parseMapData } from "./MapData";
import { Event } from "./Events";

type AssetMeshes = {
  forest: AbstractMesh
  grass: AbstractMesh
  sheep: AbstractMesh
  farm: AbstractMesh
  village: AbstractMesh
  rocks: AbstractMesh
}
export class MapLoader {

  private assetMeshes?: AssetMeshes;
  constructor(private scene: Scene, private events: Observable<Event>) {}

  public async loadAssets() {
    if(this.assetMeshes) {
      return;
    }

    const loadGlb = async (filename: string) => {
      const imported = await SceneLoader.ImportMeshAsync(
        "",
        filename,
        undefined,
        undefined,
        undefined,
        ".glb"
      )
  
      const mesh = imported.meshes.find(m => m.name === "__root__")
      if(mesh) {
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

    for(const mesh of Object.values(meshes)) {
      mesh.rotate(Vector3.Up(), Math.PI / 6);
      mesh.scalingDeterminant = 1.7;
      mesh.setEnabled(false)
    }
    
    this.assetMeshes = meshes
  }

  public async load(filename: string, map: Mesh[][], mapSize: number, mirrorTexture: MirrorTexture, shadowGenerator: ShadowGenerator) {
      const mapData = parseMapData(await Tools.LoadFileAsync(filename, false))


      if(!this.assetMeshes) {
        throw new Error("Asset meshes not yet loaded");
      }
  
      // populate spaces
      for (let x = 0; x < mapSize; ++x) {
        for (let z = 0; z < mapSize; ++z) {
          const hexagon = map[x][z];
          const mapDataSpace = mapData.spaces[x][z]
          if(mapDataSpace === "empty") {
            continue;
          }
  
          const mesh = this.assetMeshes[mapDataSpace]
  
          const clone = mesh.clone(`${mapDataSpace}${x}${z}`, null);
          if (clone) {
            this.scene.addMesh(clone, true)
            clone.setEnabled(true)
            clone.receiveShadows = true;
            for (const child of clone.getChildMeshes()) {
              child.receiveShadows = true;
              mirrorTexture.renderList?.push(child);
            }
  
            shadowGenerator.addShadowCaster(clone, true);
            const rotation = Math.floor(6 * Math.random())
            clone.rotate(Vector3.UpReadOnly, rotation * Math.PI/3)
  
            clone.position = new Vector3(
              hexagon.position.x,
              clone.position.y,
              hexagon.position.z
            );
          }
        }
      }

      this.events.notifyObservers({ event: "onMapLoaded", payload: mapData })
  }
}