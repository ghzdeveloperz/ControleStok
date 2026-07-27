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

interface ImageValidationOptions {
  maxBytes: number;
  exactWidth?: number;
  exactHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxPixels?: number;
}

const readDimensions = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("O arquivo não contém uma imagem válida."));
    };
    image.src = objectUrl;
  });

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Não foi possível ler a imagem."));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });

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

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!signatureValidator(header)) {
    throw new Error("O conteúdo do arquivo não corresponde ao tipo da imagem.");
  }

  const { width, height } = await readDimensions(file);
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

  return readAsDataUrl(file);
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
