import { useCursor } from "../Cursor";

export const Tooltip = () => {
  const cursor = useCursor();

  if (!cursor.active) {
    return null;
  }

  const label = cursor.label ? `${cursor.label} ` : "";
  const text = `${label}(${cursor.mapX}, ${cursor.mapZ})`;

  return (
    <div
      style={{
        position: "absolute",
        left: cursor.x + 10,
        top: cursor.y + 10,
        width: "140px",
        padding: "15px 10px",
        borderRadius: "4px",
        fontFamily: "monospace",
        textAlign: "center",
        color: "white",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        overflow: "hidden",
      }}
    >
      {text}
    </div>
  );
};
