import { Vector, Line, Ray, Projection } from '../../Algebra';
import { Color } from '../../Drawing/Color';
import { Transform } from '../../EntityComponentSystem';
import { BoundingBox } from '../BoundingBox';
import { CollisionContact } from '../Detection/CollisionContact';
import { Collider } from './Collider';

export class CompositeCollider extends Collider {
  private _transform: Transform;

  constructor(colliders: Collider[]) {
    super();
    this._colliders = colliders;
  }

  private _colliders: Collider[];

  clearColliders() {
    this._colliders = [];
  }

  addCollider(collider: Collider) {
    this._colliders.push(collider);
  }
  getColliders(): Collider[] {
    return this._colliders;
  }

  get worldPos(): Vector {
    // TODO transform component world pos
    return this._transform?.pos ?? Vector.Zero;
  }

  get center(): Vector {
    return this._transform?.pos ?? Vector.Zero;
  }

  get bounds(): BoundingBox {
    // TODO cache this
    const colliders = this.getColliders();
    const results = colliders.reduce(
      (acc, collider) => acc.combine(collider.bounds),
      colliders[0]?.bounds ?? new BoundingBox().translate(this.worldPos)
    );

    return results;
  }

  get localBounds(): BoundingBox {
    // TODO cache this
    const colliders = this.getColliders();
    const results = colliders.reduce((acc, collider) => acc.combine(collider.localBounds), colliders[0]?.localBounds ?? new BoundingBox());

    return results;
  }

  get axes(): Vector[] {
    // TODO cache this
    const colliders = this.getColliders();
    let axes: Vector[] = [];
    for (const collider of colliders) {
      axes = axes.concat(collider.axes);
    }
    return axes;
  }

  getFurthestPoint(direction: Vector): Vector {
    const colliders = this.getColliders();
    const furthestPoints: Vector[] = [];
    for (const collider of colliders) {
      furthestPoints.push(collider.getFurthestPoint(direction));
    }
    // Pick best point from all colliders
    let bestPoint = furthestPoints[0];
    let maxDistance = -Number.MAX_VALUE;
    for (const point of furthestPoints) {
      const distance = point.dot(direction);
      if (distance > maxDistance) {
        bestPoint = point;
        maxDistance = distance;
      }
    }
    return bestPoint;
  }

  getInertia(mass: number): number {
    const colliders = this.getColliders();
    let totalInertia = 0;
    for (const collider of colliders) {
      totalInertia += collider.getInertia(mass);
    }
    return totalInertia;
  }

  collide(other: Collider): CollisionContact[] {
    const colliders = this.getColliders();
    let contacts: CollisionContact[] = [];
    if (other instanceof CompositeCollider) {
      const otherColliders = other.getColliders();
      for (const colliderA of colliders) {
        for (const colliderB of otherColliders) {
          const maybeContact = colliderA.collide(colliderB);
          if (maybeContact) {
            contacts = contacts.concat(maybeContact);
          }
        }
      }
    } else {
      for (const collider of colliders) {
        const maybeContact = collider.collide(other);
        if (maybeContact) {
          contacts = contacts.concat(maybeContact);
        }
      }
    }
    // Return all the contacts
    if (contacts.length) {
      return contacts;
    }
    return [];
  }

  getClosestLineBetween(other: Collider): Line {
    const colliders = this.getColliders();
    const lines: Line[] = [];
    if (other instanceof CompositeCollider) {
      const otherColliders = other.getColliders();
      for (const colliderA of colliders) {
        for (const colliderB of otherColliders) {
          const maybeLine = colliderA.getClosestLineBetween(colliderB);
          if (maybeLine) {
            lines.push(maybeLine);
          }
        }
      }
    } else {
      for (const collider of colliders) {
        const maybeLine = other.getClosestLineBetween(collider);
        if (maybeLine) {
          lines.push(maybeLine);
        }
      }
    }

    if (lines.length) {
      let minLength = lines[0].getLength();
      let minLine = lines[0];
      for (const line of lines) {
        const length = line.getLength();
        if (length < minLength) {
          minLength = length;
          minLine = line;
        }
      }
      return minLine;
    }
    return null;
  }
  contains(point: Vector): boolean {
    const colliders = this.getColliders();
    for (const collider of colliders) {
      if (collider.contains(point)) {
        return true;
      }
    }
    return false;
  }
  rayCast(ray: Ray, max?: number): Vector {
    const colliders = this.getColliders();
    const points: Vector[] = [];
    for (const collider of colliders) {
      const vec = collider.rayCast(ray, max);
      if (vec) {
        points.push(vec);
      }
    }
    if (points.length) {
      let minPoint = points[0];
      let minDistance = minPoint.dot(ray.dir);
      for (const point of points) {
        const distance = ray.dir.dot(point);
        if (distance < minDistance) {
          minPoint = point;
          minDistance = distance;
        }
      }
      return minPoint;
    }
    return null;
  }
  project(axis: Vector): Projection {
    const colliders = this.getColliders();
    const projs: Projection[] = [];
    for (const collider of colliders) {
      const proj = collider.project(axis);
      if (proj) {
        projs.push(proj);
      }
    }
    // Merge all proj's on the same axis
    if (projs.length) {
      const newProjection = new Projection(projs[0].min, projs[0].max);
      for (const proj of projs) {
        newProjection.min = Math.min(proj.min, newProjection.min);
        newProjection.max = Math.max(proj.max, newProjection.max);
      }
      return newProjection;
    }
    return null;
  }

  update(transform: Transform): void {
    if (transform) {
      const colliders = this.getColliders();
      for (const collider of colliders) {
        collider.update(transform);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, color?: Color, pos?: Vector): void {
    const colliders = this.getColliders();
    for (const collider of colliders) {
      collider.draw(ctx, color, pos);
    }
  }
  debugDraw(ctx: CanvasRenderingContext2D, color: Color): void {
    const colliders = this.getColliders();
    for (const collider of colliders) {
      collider.draw(ctx, color);
    }
  }
  clone(): Collider {
    return new CompositeCollider(this._colliders.map((c) => c.clone()));
  }
}