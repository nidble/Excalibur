import { Graphic, GraphicOptions, DrawOptions } from './Graphic';
import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';

export interface RasterOptions {
  smoothing?: boolean;
  fillStyle?: string;
  strokeStyle?: string;
}

export abstract class Raster extends Graphic {
  public _bitmap: HTMLCanvasElement;
  public _webglTexture: WebGLTexture;
  private _ctx: CanvasRenderingContext2D;
  private _dirty: boolean = true;

  constructor(options: GraphicOptions & RasterOptions) {
    super(options);
    this.fillStyle = options.fillStyle ?? this.fillStyle;
    this.strokeStyle = options.strokeStyle ?? this.strokeStyle;
    this.smoothing = options.smoothing ?? this.smoothing;

    // TODO also initialize webgl texture
    this._bitmap = document.createElement('canvas');
    const maybeCtx = this._bitmap.getContext('2d');
    if (!maybeCtx) {
      throw new Error('Browser does not support 2d canvas drawing');
    } else {
      this._ctx = maybeCtx;
    }
  }

  /**
   * Gets whether the graphic is dirty
   */
  public get dirty() {
    return this._dirty;
  }

  /**
   * Flags the graphic as dirty, meaning it must be re-rasterized before draw.
   * This should be called any time the graphics state changes such that it affects the outputed drawing
   */
  public flagDirty() {
    this._dirty = true;
  }

  /**
   * Gets or sets the current width of the Raster graphic. Setting the width will cause the raster
   * to be flagged dirty causing a re-raster on the next draw.
   */
  public get width() {
    return this._bitmap.width;
  }
  public set width(value: number) {
    this._bitmap.width = value;
    this.flagDirty();
  }

  /**
   * Gets or sets the current height of the Raster graphic. Setting the height will cause the raster
   * to be flagged dirty causing a re-raster on the next draw.
   */
  public get height() {
    return this._bitmap.height;
  }
  public set height(value: number) {
    this._bitmap.height = value;
    this.flagDirty();
  }

  private _smoothing: boolean = false;
  /**
   * Gets or sets the smoothing (anti-aliasing of the graphic). Setting the height will cause the raster
   * to be flagged dirty causing a re-raster on the next draw.
   */
  public get smoothing() {
    return this._smoothing;
  }
  public set smoothing(value: boolean) {
    this._smoothing = value;
    this.flagDirty();
  }

  private _fillStyle: string = 'black';
  /**
   * Gets or sets the fillStyle of the Raster graphic. Setting the fillStyle will cause the raster to be
   * flagged dirty causing a re-raster on the next draw.
   */
  public get fillStyle() {
    return this._fillStyle;
  }
  public set fillStyle(value) {
    this._fillStyle = value;
    this.flagDirty();
  }

  private _strokeStyle: string = '';
  /**
   * Gets or sets the strokeStyle of the Raster graphic. Setting the strokeStyle will cause the raster to be
   * flagged dirty causing a re-raster on the next draw.
   */
  public get strokeStyle() {
    return this._strokeStyle;
  }
  public set strokeStyle(value) {
    this._strokeStyle = value;
    this.flagDirty();
  }

  /**
   * Rasterize the graphic to a bitmap making it usuable as in excalibur. Rasterize is called automatically if
   * the graphic is [[Graphic.dirty]] on the next [[Graphic.draw]] call
   */
  public rasterize(): void {
    this._dirty = false;
    this._ctx.clearRect(0, 0, this.width, this.height);
    this._ctx.save();
    this._ctx.imageSmoothingEnabled = this.smoothing;
    this._ctx.strokeStyle = this.strokeStyle;
    this._ctx.fillStyle = this.fillStyle;
    this._ctx.globalAlpha = this.opacity;
    this.execute(this._ctx);
    this._ctx.restore();
    // TODO re-bind and update webgl texture here
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number) {
    if (this._dirty) {
      this.rasterize();
    }

    ex.drawImage(this._bitmap, x, y);
  }

  /**
   * Executes drawing implemenation of the graphic, this is where the specific drawing code for the graphic
   * should be implemented. Once `rasterize()` the graphic can be drawn to the [[ExcaliburGraphicsContext]] via `draw(...)`
   * @param ctx Canvas to draw the graphic to
   * @param options
   */
  abstract execute(ctx: CanvasRenderingContext2D, options?: DrawOptions): void;
}
