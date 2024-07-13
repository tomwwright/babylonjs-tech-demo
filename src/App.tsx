import { BablylonJsScene } from "./BabylonJsScene"
import { CursorProvider } from "./Cursor"
import { Tooltip } from "./components/Tooltip"
import { SceneStateProvider } from "./SceneState"
import { ToggleReflectionsButton } from "./components/ToggleReflectionsButton"
import { BabylonJsProvider } from "./BabylonJsProvider"
import { EventButton } from "./components/EventButton"
import { ToggleSSAOButton } from "./components/ToggleSSAOButton"
import { FpsCounter } from "./components/FpsCounter"
import { ToggleScalingLevelButton } from "./components/ToggleScalingLevelButton"
import { ToggleSSAOBlurButton } from "./components/ToggleSSAOBlurButton"
import { ToggleShadowsButton } from "./components/ToggleShadowsButton"
import {
  Footer,
  Frame,
  Header,
  Sidebar,
  SidebarContainer,
} from "./components/Frame"
import { Flex } from "./components/Flex"

function App() {
  return (
    <BabylonJsProvider>
      <CursorProvider>
        <SceneStateProvider>
          <Frame>
            <Header>
              <Flex justifyContent="space-between">
                <span>BabylonJS Tech Demo</span>
                <a
                  href="https://github.com/tomwwright/babylonjs-tech-demo"
                  style={{ color: "white", textDecoration: "underline" }}
                >
                  github.com/tomwwright/babylonjs-tech-demo
                </a>
              </Flex>
            </Header>
            <SidebarContainer>
              <Sidebar>
                <EventButton event={{ event: "rotateCamera", payload: "left" }}>
                  Rotate left
                </EventButton>
                <EventButton
                  event={{ event: "rotateCamera", payload: "right" }}
                >
                  Rotate right
                </EventButton>
              </Sidebar>
              <Sidebar>
                <ToggleReflectionsButton />
                <ToggleScalingLevelButton />
                <ToggleSSAOButton />
                <ToggleSSAOBlurButton />
                <ToggleShadowsButton />
              </Sidebar>
            </SidebarContainer>
            <Footer>
              <FpsCounter />
              <Flex gap="8px" alignItems="center">
                <span>Load maps</span>
                <button>None</button>
                <button>Map 1</button>
                <button>Map 2</button>
              </Flex>
            </Footer>
          </Frame>
          <BablylonJsScene />
        </SceneStateProvider>
        <Tooltip />
      </CursorProvider>
    </BabylonJsProvider>
  )
}

export default App
