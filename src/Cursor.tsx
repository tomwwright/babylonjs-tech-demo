import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  PropsWithChildren,
  useState,
  useRef,
} from "react"

export interface CursorState {
  x: number
  y: number
  active: boolean
  mapX?: number
  mapZ?: number
  label?: string
}

interface CursorContext extends CursorState {
  setCursor: (cursor: Partial<CursorState>) => void
}

const defaultState = {
  x: 0,
  y: 0,
  active: false,
} satisfies CursorState

const CursorContext = createContext<CursorContext>({
  ...defaultState,
  setCursor: () => {},
})

export const useCursor = () => useContext(CursorContext)

export const CursorProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<CursorState>(defaultState)
  const stateRef = useRef(state)

  const setCursor = useCallback(
    (updates: Partial<CursorState>) => {
      const state = stateRef.current
      const updated = {
        ...state,
        ...updates,
      }
      setState(updated)
      stateRef.current = updated // always reference latest version of state in setState callback
    },
    [setState],
  )

  useEffect(() => {
    const updateCursor = (event: MouseEvent) => {
      setCursor({
        x: event.clientX,
        y: event.clientY,
      })
    }

    window.addEventListener("mousemove", updateCursor)

    return () => {
      window.removeEventListener("mousemove", updateCursor)
    }
  }, [setCursor])

  return (
    <CursorContext.Provider value={{ ...state, setCursor }}>
      {children}
    </CursorContext.Provider>
  )
}
