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
  public readonly maxVisibleSurroundingDistance: number
  private currentAnimation: Nullable<Animatable> = null

  constructor(
    public readonly camera: ArcRotateCamera,
    events: Observable<Event>,
    public maxX: number = 10,
    public maxZ: number = 10,
  ) {
    // configure camera controls

    const maxCameraDistance = 25
    const cameraAngleDegrees = (Math.PI / 180) * 45

    camera.radius = 10
    camera.upperRadiusLimit = maxCameraDistance
    camera.lowerRadiusLimit = 1.5

    camera.alpha = 0

    camera.mapPanning = true
    camera.lowerBetaLimit = cameraAngleDegrees
    camera.upperBetaLimit = cameraAngleDegrees

    camera.maxZ = 100 // different maxZ, this refers to depth

    // sin(A) = perp / hyp
    this.maxVisibleSurroundingDistance =
      Math.sin(cameraAngleDegrees) * maxCameraDistance * 2.25

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
          this.maxX * 0.66,
          camera.target.y,
          this.maxZ / 2,
        )
        camera.alpha = 0
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
