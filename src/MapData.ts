
type MapData = {
  rows: number,
  columns: number,
  spaces: Space[][]
}

type Space = "empty" | "forest"

export function parseMapData(mapDataString: string): MapData {
  const mapData = mapDataString.trim().split("\n").map(r => r.trim())

  const rows = mapData.length
  const columns = mapData[0].length

  const spaces: Space[][] = mapData.map(
    row => row.split("").map(
      space => {
        switch(space) {
          case "F":
            return "forest"
          case "_":
          default:
            return "empty"
        }
      }
    )
  )

  return {
    rows,
    columns,
    spaces
  }
}