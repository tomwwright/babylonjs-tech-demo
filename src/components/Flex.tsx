import * as React from "react"

type FlexProps = Pick<
  React.CSSProperties,
  | "alignItems"
  | "flex"
  | "flexBasis"
  | "flexDirection"
  | "flexFlow"
  | "flexGrow"
  | "flexShrink"
  | "flexWrap"
  | "gap"
  | "justifyContent"
>

export const Flex = (props: FlexProps & React.PropsWithChildren) => (
  <div
    style={{
      display: "flex",
      ...props,
    }}
  >
    {props.children}
  </div>
)
