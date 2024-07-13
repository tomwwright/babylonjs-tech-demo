import {
  ActionManager,
  Animatable,
  Animation,
  ArcRotateCamera,
  EasingFunction,
  ExecuteCodeAction,
  Nullable,
  Observable,
  SineEase,
  Vector3,
} from "@babylonjs/core"
import { Event } from "./Events"

export class CameraController {
  public readonly maxCameraDistance = 12
  public readonly cameraAngleDegrees = (Math.PI / 180) * 45
  private currentAnimation: Nullable<Animatable> = null

  constructor(
    public readonly camera: ArcRotateCamera,
    events: Observable<Event>,
    public maxX: number,
    public maxZ: number,
  ) {
    // configure camera controls

    camera.radius = 10
    camera.upperRadiusLimit = this.maxCameraDistance
    camera.lowerRadiusLimit = 1.5

    camera.alpha = Math.PI

    camera.mapPanning = true
    camera.lowerBetaLimit = this.cameraAngleDegrees
    camera.upperBetaLimit = this.cameraAngleDegrees

    camera.maxZ = 60 // different maxZ, this refers to depth

    // camera bounds

    const checkCameraTargetBounds = () => {
      if (camera.target.x < 0) {
        camera.target.x = 0
      }
      if (camera.target.x > this.maxX) {
        camera.target.x = this.maxX
      }

      if (camera.target.z < 0) {
        camera.target.z = 0
      }
      if (camera.target.z > this.maxZ) {
        camera.target.z = this.maxZ
      }
    }

    camera
      .getScene()
      .actionManager.registerAction(
        new ExecuteCodeAction(
          ActionManager.OnEveryFrameTrigger,
          checkCameraTargetBounds,
        ),
      )

    // rotate camera on events

    events.add(({ event, payload }) => {
      if (event === "rotateCamera") {
        const direction = payload
        this.rotate(direction)
      }
    })

    // center camera on map loading

    events.add(({ event }) => {
      if (event === "onMapLoaded") {
        camera.target = new Vector3(
          this.maxX / 3,
          camera.target.y,
          this.maxZ / 2,
        )
        camera.alpha = Math.PI
      }
    })
  }

  public setBounds(maxX: number, maxZ: number) {
    this.maxX = maxX
    this.maxZ = maxZ
  }

  public rotate(direction: "left" | "right") {
    if (this.currentAnimation) {
      throw new Error("Cannot rotate camera when already rotating")
    }

    const camera = this.camera

    const frameRate = 30
    const rotate = new Animation(
      "rotation",
      "alpha",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
    )
    const easing = new SineEase()
    easing.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
    rotate.setEasingFunction(easing)

    const start = camera.alpha
    const amount = Math.PI / 3
    const end =
      direction == "left" ? camera.alpha + amount : camera.alpha - amount

    rotate.setKeys([
      {
        frame: 0,
        value: start,
      },
      {
        frame: frameRate,
        value: end,
      },
    ])

    this.currentAnimation = camera.getScene().beginDirectAnimation(
      camera,
      [rotate],
      0,
      frameRate,
      false,
      2, // 2x speed
      () => this.onAnimationEnd(),
    )
  }

  private onAnimationEnd() {
    this.currentAnimation = null
  }
}
