import {
  ActionManager,
  ArcRotateCamera,
  CascadedShadowGenerator,
  Color3,
  DefaultRenderingPipeline,
  DepthOfFieldEffectBlurLevel,
  DirectionalLight,
  ExecuteCodeAction,
  HemisphericLight,
  MeshBuilder,
  MirrorTexture,
  Observable,
  Plane,
  RenderTargetTexture,
  Scene,
  SSAO2RenderingPipeline,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core"
import { SceneState } from "./SceneState"

export class SceneRendering {
  public readonly light: DirectionalLight
  public readonly ambientLight: HemisphericLight
  public readonly shadowGenerator: CascadedShadowGenerator
  public readonly mirrorTexture: MirrorTexture

  constructor(
    scene: Scene,
    camera: ArcRotateCamera,
    stateObservable: Observable<SceneState>,
    maxX: number,
    maxZ: number,
    cameraAngleDegrees: number,
    maxCameraDistance: number,
  ) {
    // set up lighting

    const light = new DirectionalLight(
      "light",
      new Vector3(1, -1, 1).normalize(),
      scene,
    )
    light.autoUpdateExtends = true
    light.autoCalcShadowZBounds = true
    const ambientLight = new HemisphericLight(
      "ambient",
      new Vector3(1, 1, 0),
      scene,
    )

    // configure shadows

    const shadowGenerator = new CascadedShadowGenerator(1024, light)
    shadowGenerator.autoCalcDepthBounds = false
    shadowGenerator.bias = 0.01
    shadowGenerator.numCascades = 2
    shadowGenerator.usePercentageCloserFiltering = true
    shadowGenerator.depthClamp = false
    shadowGenerator.shadowMaxZ = 60

    stateObservable.add(({ shadowsEnabled }) => {
      light.shadowEnabled = shadowsEnabled
    })

    // reflective ground

    const skybox = MeshBuilder.CreateBox("skybox", { size: 50 }, scene)
    skybox.position = new Vector3(maxX / 2, -2, maxZ / 2)
    const skyboxMaterial = new StandardMaterial("skybox", scene)
    skyboxMaterial.emissiveColor = new Color3(0.3, 0.3, 0.7)
    skyboxMaterial.backFaceCulling = false
    skyboxMaterial.disableLighting = true
    skybox.material = skyboxMaterial

    // sin(A) = perp / hyp
    const visibleSurroundingDistance =
      Math.sin(cameraAngleDegrees) * maxCameraDistance * 2.25

    const width = maxX + 2 * visibleSurroundingDistance
    const height = maxZ + 2 * visibleSurroundingDistance

    const ground = MeshBuilder.CreateGround("ground", { width, height })
    ground.position = new Vector3(maxX / 2, 0.1, maxZ / 2)
    ground.receiveShadows = true
    const groundMaterial = new StandardMaterial("ground")
    const mirrorTexture = new MirrorTexture("mirror", { ratio: 0.5 }, scene)
    mirrorTexture.mirrorPlane = Plane.FromPositionAndNormal(
      ground.position,
      ground.getFacetNormal(0).scale(-1),
    )
    mirrorTexture.renderList = [skybox]
    mirrorTexture.adaptiveBlurKernel = 24
    mirrorTexture.noPrePassRenderer = true

    groundMaterial.reflectionTexture = mirrorTexture
    groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.3)
    groundMaterial.specularColor = new Color3(0.2, 0.2, 0.3)
    ground.material = groundMaterial

    ambientLight.excludedMeshes.push(ground)

    // toggle rendering resolution

    stateObservable.add((state) => {
      if (state.scalingLevel === scene.getEngine().getHardwareScalingLevel()) {
        return
      }
      scene.getEngine().setHardwareScalingLevel(state.scalingLevel)
    })

    // toggling of mirror texture rendering

    stateObservable.add((state) => {
      if (state.reflectionsEnabled) {
        groundMaterial.reflectionTexture = mirrorTexture
        mirrorTexture.refreshRate =
          RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME
        groundMaterial.emissiveColor = Color3.BlackReadOnly
      } else {
        groundMaterial.reflectionTexture = null
        mirrorTexture.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE
        groundMaterial.emissiveColor = new Color3(0.3, 0.3, 0.7)
      }
    })

    // set up rendering

    const renderer = new DefaultRenderingPipeline("renderer", true, scene, [
      camera,
    ])

    // anti aliasing

    renderer.fxaaEnabled = true

    // depth of field

    renderer.depthOfFieldEnabled = true
    renderer.depthOfField.fStop = 1.2
    renderer.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.High

    const setCameraFocalLength = () => {
      renderer.depthOfField.focusDistance = camera.radius * 1000
    }

    scene.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnEveryFrameTrigger,
        setCameraFocalLength,
      ),
    )

    // ambient occlusion

    const ssao = new SSAO2RenderingPipeline("ssao", scene, 1)
    ssao.samples = 16
    ssao.bilateralSoften = 0.1
    ssao.totalStrength = 1.0
    ssao.radius = 0.5

    scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
      "ssao",
      camera,
    )

    // toggle SSAO

    let currentSSAO: SceneState["ssao"] = "on"
    stateObservable.add((state) => {
      if (state.ssao === currentSSAO) {
        return
      }
      currentSSAO = state.ssao
      // order of cases here is specific, not good code >:(
      switch (state.ssao) {
        case "on":
          scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
            "ssao",
            camera,
          )
          scene.postProcessRenderPipelineManager.enableEffectInPipeline(
            "ssao",
            ssao.SSAOCombineRenderEffect,
            camera,
          )
          break
        case "only":
          scene.postProcessRenderPipelineManager.disableEffectInPipeline(
            "ssao",
            ssao.SSAOCombineRenderEffect,
            camera,
          )
          break
        case "off":
          scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(
            "ssao",
            camera,
          )
          break
      }
    })

    stateObservable.add(({ ssaoBlurEnabled }) => {
      ssao.bypassBlur = !ssaoBlurEnabled
    })

    this.light = light
    this.ambientLight = ambientLight
    this.shadowGenerator = shadowGenerator
    this.mirrorTexture = mirrorTexture
  }
}
