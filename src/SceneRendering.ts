import {
  ActionManager,
  ArcRotateCamera,
  CascadedShadowGenerator,
  Color3,
  DefaultRenderingPipeline,
  DepthOfFieldEffectBlurLevel,
  DirectionalLight,
  ExecuteCodeAction,
  GroundMesh,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  MirrorTexture,
  Observable,
  Plane,
  RenderTargetTexture,
  Scene,
  ShadowGenerator,
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

  private readonly ground: GroundMesh
  private readonly skybox: Mesh

  constructor(
    scene: Scene,
    camera: ArcRotateCamera,
    stateObservable: Observable<SceneState>,
    size: number = 10,
  ) {
    // set up lighting

    const light = new DirectionalLight(
      "light",
      new Vector3(-1, -1, -1).normalize(),
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

    const shadowGenerator = new CascadedShadowGenerator(2048, light)
    shadowGenerator.autoCalcDepthBounds = false
    shadowGenerator.bias = 0.01
    shadowGenerator.numCascades = 2
    shadowGenerator.usePercentageCloserFiltering = true
    shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_MEDIUM
    shadowGenerator.depthClamp = false
    shadowGenerator.shadowMaxZ = 60
    shadowGenerator.darkness = 0.05

    stateObservable.add(({ shadowsEnabled }) => {
      light.shadowEnabled = shadowsEnabled
    })

    // reflective ground

    this.skybox = MeshBuilder.CreateBox("skybox", { size: 1 }, scene)
    this.ground = MeshBuilder.CreateGround("ground")
    this.resize(size)

    const skyboxMaterial = new StandardMaterial("skybox", scene)
    skyboxMaterial.emissiveColor = new Color3(0.3, 0.3, 0.7)
    skyboxMaterial.backFaceCulling = false
    skyboxMaterial.disableLighting = true
    this.skybox.material = skyboxMaterial

    this.ground.receiveShadows = true
    const groundMaterial = new StandardMaterial("ground")
    const mirrorTexture = new MirrorTexture("mirror", { ratio: 0.5 }, scene)
    mirrorTexture.mirrorPlane = Plane.FromPositionAndNormal(
      this.ground.position,
      this.ground.getFacetNormal(0).scale(-1),
    )
    mirrorTexture.renderList = [this.skybox]
    mirrorTexture.adaptiveBlurKernel = 24
    mirrorTexture.noPrePassRenderer = true

    groundMaterial.reflectionTexture = mirrorTexture
    groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.3)
    groundMaterial.specularColor = new Color3(0.2, 0.2, 0.3)
    this.ground.material = groundMaterial

    ambientLight.excludedMeshes.push(this.ground)

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

  public resize(size: number) {
    this.skybox.position = new Vector3(0, 0, 0)
    this.skybox.scaling = new Vector3(size, 20, size)
    this.ground.position = new Vector3(0, 0.1, 0)
    this.ground.scaling = new Vector3(size, 1, size)
  }
}
