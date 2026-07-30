const IMAGE_SIGNATURES = {
  "image/jpeg": (bytes: Uint8Array) =>
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes: Uint8Array) =>
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47,
  "image/webp": (bytes: Uint8Array) =>
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
} as const;

const SAFE_DATA_IMAGE_PREFIXES = [
  "data:image/jpeg;base64,",
  "data:image/png;base64,",
  "data:image/webp;base64,",
] as const;
const SAFE_LOCAL_IMAGE = /^\/images\/[\p{L}\p{N} _().-]+$/u;

type AllowedImageType = keyof typeof IMAGE_SIGNATURES;

interface ImageDimensions {
  width: number;
  height: number;
}

interface ImageValidationOptions {
  maxBytes: number;
  exactWidth?: number;
  exactHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxPixels?: number;
}

const JPEG_SIZE_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
  0xcf,
]);

const readImageDimensions = (
  bytes: Uint8Array,
  mimeType: AllowedImageType,
): ImageDimensions | null => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (mimeType === "image/png" && bytes.length >= 24) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (mimeType === "image/webp" && bytes.length >= 30) {
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (chunk === "VP8X") {
      return {
        width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)),
        height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)),
      };
    }
    if (chunk === "VP8L" && bytes[20] === 0x2f) {
      return {
        width: 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]),
        height:
          1 +
          (((bytes[24] & 0x0f) << 10) |
            (bytes[23] << 2) |
            ((bytes[22] & 0xc0) >> 6)),
      };
    }
    if (
      chunk === "VP8 " &&
      bytes[23] === 0x9d &&
      bytes[24] === 0x01 &&
      bytes[25] === 0x2a
    ) {
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    }
  }

  if (mimeType === "image/jpeg") {
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset];
      offset += 1;
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (marker === 0xda || offset + 2 > bytes.length) break;

      const segmentLength = view.getUint16(offset);
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      if (JPEG_SIZE_MARKERS.has(marker) && segmentLength >= 7) {
        return {
          height: view.getUint16(offset + 3),
          width: view.getUint16(offset + 5),
        };
      }
      offset += segmentLength;
    }
  }

  return null;
};

const assertDimensions = (
  { width, height }: ImageDimensions,
  options: ImageValidationOptions,
) => {
  if (width < 1 || height < 1) {
    throw new Error("A imagem não possui dimensões válidas.");
  }
  if (
    options.exactWidth !== undefined &&
    options.exactHeight !== undefined &&
    (width !== options.exactWidth || height !== options.exactHeight)
  ) {
    throw new Error(
      `A imagem deve ter exatamente ${options.exactWidth}x${options.exactHeight} px.`,
    );
  }
  if (
    (options.maxWidth !== undefined && width > options.maxWidth) ||
    (options.maxHeight !== undefined && height > options.maxHeight) ||
    (options.maxPixels !== undefined && width * height > options.maxPixels)
  ) {
    throw new Error("As dimensões da imagem excedem o limite permitido.");
  }
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("O arquivo não contém uma imagem válida."));
    };
    image.src = objectUrl;
  });

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Não foi possível ler a imagem."));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(blob);
  });

const reencodeImage = async (
  image: HTMLImageElement,
  mimeType: AllowedImageType,
  width: number,
  height: number,
  maxBytes: number,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível processar a imagem.");
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("Não foi possível processar a imagem.")),
      mimeType,
      mimeType === "image/png" ? undefined : 0.9,
    );
  });

  if (blob.size <= 0 || blob.size > maxBytes) {
    const maxSizeKb = Math.floor(maxBytes / 1024);
    throw new Error(
      `A imagem processada deve ter no máximo ${maxSizeKb} KB.`,
    );
  }

  return readAsDataUrl(blob);
};

export const validateAndReadImage = async (
  file: File,
  options: ImageValidationOptions,
) => {
  const mimeType = file.type as AllowedImageType;
  const signatureValidator = IMAGE_SIGNATURES[mimeType];

  if (!signatureValidator) {
    throw new Error("Use uma imagem JPEG, PNG ou WebP.");
  }
  if (file.size <= 0 || file.size > options.maxBytes) {
    const maxSizeKb = Math.floor(options.maxBytes / 1024);
    throw new Error(`A imagem deve ter no máximo ${maxSizeKb} KB.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!signatureValidator(bytes)) {
    throw new Error("O conteúdo do arquivo não corresponde ao tipo da imagem.");
  }

  const parsedDimensions = readImageDimensions(bytes, mimeType);
  if (!parsedDimensions) {
    throw new Error("Não foi possível validar as dimensões da imagem.");
  }
  assertDimensions(parsedDimensions, options);

  const image = await loadImage(file);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (width !== parsedDimensions.width || height !== parsedDimensions.height) {
    throw new Error("As dimensões declaradas da imagem são inconsistentes.");
  }
  assertDimensions({ width, height }, options);

  return reencodeImage(image, mimeType, width, height, options.maxBytes);
};

export const sanitizeImageSource = (
  value: unknown,
  fallback: string,
  maxLength = 700_000,
) => {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    return fallback;
  }
  if (
    SAFE_LOCAL_IMAGE.test(value) ||
    SAFE_DATA_IMAGE_PREFIXES.some((prefix) => value.startsWith(prefix))
  ) {
    return value;
  }
  return fallback;
};
