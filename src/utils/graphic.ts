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

export async function binarize(input: ImageBitmap, contrast: number, inverted: boolean): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas');
  canvas.width = input.width;
  canvas.height = input.height;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(input, 0, 0);

  const imageData = ctx.getImageData(0, 0, input.width, input.height);
  const data = imageData.data;

  const threshold = 255 * contrast / 100;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (avg < threshold) {
      data[i] = data[i + 1] = data[i + 2] = inverted ? 255 : 0;
    } else {
      data[i] = data[i + 1] = data[i + 2] = inverted ? 0 : 255;
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
