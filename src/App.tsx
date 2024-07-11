import { BablylonJs } from "./BabylonJs";
import { CursorProvider } from "./Cursor";
import { Tooltip } from "./components/Tooltip";
import { SceneStateProvider } from "./SceneState";
import { ToggleReflectionsButton } from "./components/ToggleReflectionsButton";
import { BabylonJsProvider } from "./BabylonJsProvider";
import { EventButton } from "./components/EventButton";
import { ToggleSSAOButton } from "./components/ToggleSSAOButton";
import { FpsCounter } from "./components/FpsCounter";
import { ToggleScalingLevelButton } from "./components/ToggleScalingLevelButton";
import { ToggleSSAOBlurButton } from "./components/ToggleSSAOBlurButton";
import { ToggleShadowsButton } from "./components/ToggleShadowsButton";
import {
  Footer,
  Frame,
  Header,
  Sidebar,
  SidebarContainer,
} from "./components/Frame";

function App() {
  return (
    <BabylonJsProvider>
      <CursorProvider>
        <SceneStateProvider>
          <Frame>
            <Header>BabylonJS Tech Demo</Header>
            <SidebarContainer>
              <Sidebar>
                <EventButton event="rotate-left">Rotate left</EventButton>
                <EventButton event="rotate-right">Rotate right</EventButton>
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
            </Footer>
          </Frame>
          <BablylonJs />
        </SceneStateProvider>
        <Tooltip />
      </CursorProvider>
    </BabylonJsProvider>
  );
}

export default App;
