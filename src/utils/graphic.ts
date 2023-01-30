export interface ISize {
  width: number;
  height: number;
}

export interface IPosition {
  x: number;
  y: number;
}

export interface IScale {
  scale: number;
}

export function scaleInside(container: ISize, target: ISize, padding = 0): ISize & IScale {
  const ratio = target.width / target.height;

  const canvas: ISize = {
    width: container.width - padding * 2,
    height: container.height - padding * 2,
  };

  const matchWidth: ISize & IScale = {
    width: canvas.width,
    height: canvas.width / ratio,
    scale: canvas.width / target.width,
  };

  const matchHeight: ISize & IScale = {
    width: ratio * canvas.height,
    height: canvas.height,
    scale: canvas.height / target.height,
  };

  if (matchWidth.height <= canvas.height) {
    return matchWidth;
  } else {
    return matchHeight;
  }
}

export function scaleCrop(container: ISize, target: ISize, padding = 0): ISize & IScale {
  const ratio = target.width / target.height;

  const canvas: ISize = {
    width: container.width - padding * 2,
    height: container.height - padding * 2,
  };

  const matchWidth: ISize & IScale = {
    width: canvas.width,
    height: canvas.width / ratio,
    scale: canvas.width / target.width,
  };

  const matchHeight: ISize & IScale = {
    width: ratio * canvas.height,
    height: canvas.height,
    scale: canvas.height / target.height,
  };

  if (matchWidth.height >= canvas.height) {
    return matchWidth;
  } else {
    return matchHeight;
  }
}

export function centerOf(container: ISize): IPosition {
  return { x: container.width / 2, y: container.height / 2 };
}

export async function binarize(input: ImageBitmap, target: ISize, contrast: number, inverted: boolean, dither: boolean): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(input, 0, 0, target.width, target.height);

  const imageData = ctx.getImageData(0, 0, input.width, input.height);
  const data = imageData.data;

  const threshold = 255 * contrast / 100;

  function set(i: number, color: number) {
    data[i] = data[i + 1] = data[i + 2] = Math.max(Math.min(0xFF, color), 0x00);
  }

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    let color = avg > threshold ? 0xFF : 0x00;
    set(i, inverted ? 0xFF - color : color);

    if (dither) {
      const error = avg - color;
      const w = canvas.width * 4;
      set(i + 4, data[i + 4] + error * 7 / 16);
      set(i - 4 + w, data[i - 4 + w] + error * 3 / 16);
      set(i + w, data[i + w] + error * 5 / 16);
      set(i + 4 + w, data[i + 4 + w] + error * 1 / 16);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return await createImageBitmap(canvas);
}

export function toBits(input: ImageData): Uint8Array {
  const output = new Uint8Array(Math.ceil(input.data.length / 4 / 8));

  for (let i = 0; i < input.data.length / 4; i++) {
    output[Math.floor(i / 8)] |= ((input.data[i * 4] ? 1 : 0) << (7 - i % 8));
  }

  return output;
}
