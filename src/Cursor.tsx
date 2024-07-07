import * as React from "react";

export interface CursorState {
  x: number;
  y: number;
  active: boolean;
  mapX?: number;
  mapZ?: number;
}

interface CursorContext extends CursorState {
  setCursor: (cursor: CursorState) => void;
}

const defaultState = {
  x: 0,
  y: 0,
  active: false,
} satisfies CursorState;

const CursorContext = React.createContext<CursorContext>({
  ...defaultState,
  setCursor: () => {},
});

export const useCursor = () => React.useContext(CursorContext);

export const CursorProvider = ({ children }: React.PropsWithChildren) => {
  const [state, setState] = React.useState<CursorState>(defaultState);

  return (
    <CursorContext.Provider value={{ ...state, setCursor: setState }}>
      {children}
    </CursorContext.Provider>
  );
};
