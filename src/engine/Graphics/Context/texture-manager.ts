import { ExcaliburGraphicsContextWebGL } from './ExcaliburGraphicsContextWebGL';
import { Graphic } from '../Graphic';
import { Raster } from '../Raster';
import { ImageSource } from './ExcaliburGraphicsContext';

/**
 * Manages loading and unloading webgl textures from [[Graphic|graphics]]
 */
export class TextureManager {
  private _exgl: ExcaliburGraphicsContextWebGL;
  private _graphicTexture: { [graphicId: number]: WebGLTexture } = {};
  constructor(context: ExcaliburGraphicsContextWebGL) {
    this._exgl = context;
  }

  hasWebGLTexture(graphic: Graphic) {
    return !!this._graphicTexture[graphic.id];
  }

  getWebGLTexture(graphic: Graphic): WebGLTexture | null {
    return this._graphicTexture[graphic.id];
  }

  updateFromGraphic(graphic: Graphic): void {
    const gl = this._exgl.__gl as WebGLRenderingContext;

    let glTex: WebGLTexture;
    if (this.hasWebGLTexture(graphic)) {
      // TODO this is gross
      if (graphic instanceof Raster && graphic._flagTextureDirty) {
        graphic._flagTextureDirty = false;
        gl.bindTexture(gl.TEXTURE_2D, graphic.__glTexture);
        const source = this._ensurePowerOfTwoImage(graphic.getSource());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      }

      // If the webgltexture exists exit early to avoid re-shipping bytes to the gpu
      return;
    } else {
      glTex = graphic.__glTexture = gl.createTexture();
    }

    const source = this._ensurePowerOfTwoImage(graphic.getSource());

    gl.bindTexture(gl.TEXTURE_2D, glTex);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // NEAREST for pixels
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    this._graphicTexture[graphic.id] = glTex;
  }

  /**
   * WebGL only supports POT images
   * https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
   * @param image
   */
  private _ensurePowerOfTwoImage(image: ImageSource): ImageSource {
    if (!this._isPowerOfTwo(image.width) || !this._isPowerOfTwo(image.height)) {
      // Scale up the texture to the next highest power of two dimensions.
      const canvas = document.createElement('canvas');
      canvas.width = this._nextHighestPowerOfTwo(image.width);
      canvas.height = this._nextHighestPowerOfTwo(image.height);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      // ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, image.width, image.height);
      image = canvas;
    }
    return image;
  }

  private _isPowerOfTwo(x: number) {
    return (x & (x - 1)) == 0;
  }

  private _nextHighestPowerOfTwo(x: number) {
    --x;
    for (var i = 1; i < 32; i <<= 1) {
      x = x | (x >> i);
    }
    return x + 1;
  }
}
