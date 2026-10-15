/**
 * Client-Side Image Validation & WebP Compression
 * - Validates file size (max 5MB)
 * - Validates MIME type and file extension (images only, rejects scripts/executables)
 * - Compresses raster images to WebP via HTML5 Canvas (quality: 0.85, max dimension: 1920px)
 * - Auto-formats filenames to clean kebab-case slugs, preserving parentheses as requested
 *   (e.g., "Digital Marketing (SEO Specialist)" -> "digital-marketing-(seo-specialist)")
 * - Preserves SVG/GIF or converts JPEG/PNG/WebP/AVIF to clean WebP
 * - Runs 100% in the user's browser, freeing server resources and securing the backend.
 */

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.avif',
]);

/**
 * Convert string to clean kebab-case slug, preserving parentheses and clean words.
 * e.g., "Digital Marketing (SEO Specialist)" -> "digital-marketing-(seo-specialist)"
 */
export function toKebabSlug(str: string): string {
  if (!str) return 'file';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function validateImageFile(file: File): void {
  if (!file) {
    throw new Error('File tidak ditemukan');
  }

  // 1. File size check (max 5MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`Ukuran file (${sizeInMb} MB) melebihi batas maksimum 5 MB.`);
  }

  // 2. Extension check
  const extMatch = file.name.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Format file "${ext || 'tanpa ekstensi'}" tidak diizinkan. Hanya file gambar (JPG, PNG, WebP, GIF, SVG, AVIF) yang diperbolehkan.`
    );
  }

  // 3. MIME type check
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    throw new Error(
      `Tipe file "${file.type}" tidak diizinkan. Harap upload gambar yang valid.`
    );
  }
}

export async function compressImageToWebp(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    targetName?: string;
  } = {}
): Promise<File> {
  // 1. Client-side validation
  validateImageFile(file);

  const rawBase = options.targetName || file.name.replace(/\.[^/.]+$/, '');
  const cleanBase = toKebabSlug(rawBase) || 'file';

  // SVG files are vector - do not convert to raster WebP
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return file;
  }

  // Animated GIF files - preserve if caller wants or let canvas process
  if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
    return file;
  }

  // Only run canvas in browser environment
  if (typeof window === 'undefined') {
    return file;
  }

  const maxWidth = options.maxWidth || 1920;
  const maxHeight = options.maxHeight || 1920;
  const quality = options.quality ?? 0.85;

  return new Promise<File>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk proses kompresi'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down if larger than max bounds while preserving aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file);
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }

              // Set the slugified filename with .webp extension
              const newFileName = `${cleanBase}.webp`;

              const webpFile = new File([blob], newFileName, {
                type: 'image/webp',
                lastModified: Date.now(),
              });

              resolve(webpFile);
            },
            'image/webp',
            quality
          );
        } catch (err) {
          console.warn('Canvas WebP compression failed, using original file:', err);
          resolve(file);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
