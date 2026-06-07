/**
 * Portfolio Service
 *
 * Mengelola operasi CRUD untuk:
 * - Portfolio Albums
 * - Media Files
 *
 * Menggunakan PHP API sebagai sumber utama dengan localStorage fallback.
 */

import { apiClient, getLocalData, setLocalData, FALLBACK_STORAGE_KEYS, generateId } from "../lib/apiClient";
import { DEFAULT_PORTFOLIOS } from "../app/data/defaultPortfolio";

// ============================================================================
// Types
// ============================================================================

export interface Album {
  id: string;
  title?: string;
  slug?: string;
  name: string;
  coupleName?: string;
  category: string;
  coverImage: string;
  galleryImages?: string[];
  images: string[];
  location?: string;
  story?: string;
  eventDate?: string;
  date: string;
  isFeatured?: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  type: "image" | "video";
  size: number;
  uploadedAt: string;
  albumId?: string;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const STORAGE_KEYS = {
  albums: FALLBACK_STORAGE_KEYS.portfolios,
  media: FALLBACK_STORAGE_KEYS.media,
};

// ============================================================================
// Default Data from Shared Source
// ============================================================================

const defaultAlbums: Album[] = DEFAULT_PORTFOLIOS;

// ============================================================================
// Helper Functions
// ============================================================================

const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ============================================================================
// Album Operations
// ============================================================================

/**
 * Ambil semua portfolio albums
 */
export const getPortfolioAlbums = async (): Promise<Album[]> => {
  try {
    const response = await apiClient.getPortfolios();
    if (response.success && response.data) {
      setLocalData(STORAGE_KEYS.albums, response.data);
      return response.data as Album[];
    }
  } catch (err) {
    console.warn("[PortfolioService] getPortfolioAlbums error:", err);
  }

  return getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
};

/**
 * Ambil album by ID
 */
export const getPortfolioAlbumById = async (id: string): Promise<Album | null> => {
  try {
    const response = await apiClient.getPortfolioById(id);
    if (response.success && response.data) {
      return response.data as Album;
    }
  } catch (err) {
    console.warn("[PortfolioService] getPortfolioAlbumById error:", err);
  }

  const albums = getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
  return albums.find((a) => a.id === id) || null;
};

/**
 * Ambil album by slug
 */
export const getPortfolioAlbumBySlug = async (slug: string): Promise<Album | null> => {
  try {
    const response = await apiClient.getPortfolioBySlug(slug);
    if (response.success && response.data) {
      return response.data as Album;
    }
  } catch (err) {
    console.warn("[PortfolioService] getPortfolioAlbumBySlug error:", err);
  }

  const albums = getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
  return albums.find((a) => a.slug === slug) || null;
};

/**
 * Ambil albums by category
 */
export const getPortfolioAlbumsByCategory = async (category: string): Promise<Album[]> => {
  const albums = await getPortfolioAlbums();
  return albums.filter((a) => a.category === category);
};

/**
 * Ambil featured albums
 */
export const getFeaturedAlbums = async (): Promise<Album[]> => {
  const albums = await getPortfolioAlbums();
  return albums.filter((a) => a.isFeatured);
};

/**
 * Ambil published albums
 */
export const getPublishedAlbums = async (): Promise<Album[]> => {
  const albums = await getPortfolioAlbums();
  return albums.filter((a) => a.isPublished);
};

/**
 * Buat album baru
 */
export const createPortfolioAlbum = async (
  albumData: Omit<Album, "id" | "sortOrder">
): Promise<Album | null> => {
  const albums = await getPortfolioAlbums();
  const maxSort = Math.max(0, ...albums.map((a) => a.sortOrder));

  const newAlbum: Album = {
    ...albumData,
    id: generateId(),
    sortOrder: maxSort + 1,
    slug: albumData.slug || generateSlug(albumData.name),
  };

  try {
    const response = await apiClient.createPortfolio({
      title: newAlbum.title,
      slug: newAlbum.slug,
      name: newAlbum.name,
      couple_name: newAlbum.coupleName,
      category: newAlbum.category,
      cover_image: newAlbum.coverImage,
      gallery_images: newAlbum.galleryImages,
      images: newAlbum.images,
      location: newAlbum.location,
      story: newAlbum.story,
      event_date: newAlbum.eventDate,
      date: newAlbum.date,
      is_featured: newAlbum.isFeatured,
      is_published: newAlbum.isPublished,
      sort_order: newAlbum.sortOrder,
    });

    if (response.success) {
      const updatedAlbums = [...albums, newAlbum];
      setLocalData(STORAGE_KEYS.albums, updatedAlbums);
      return newAlbum;
    }
  } catch (err) {
    console.warn("[PortfolioService] createPortfolioAlbum error:", err);
  }

  // Fallback
  albums.push(newAlbum);
  setLocalData(STORAGE_KEYS.albums, albums);
  return newAlbum;
};

/**
 * Update album
 */
export const updatePortfolioAlbum = async (
  id: string,
  updates: Partial<Album>
): Promise<boolean> => {
  try {
    const response = await apiClient.updatePortfolio(id, {
      title: updates.title,
      name: updates.name,
      slug: updates.slug,
      couple_name: updates.coupleName,
      category: updates.category,
      cover_image: updates.coverImage,
      gallery_images: updates.galleryImages,
      images: updates.images,
      location: updates.location,
      story: updates.story,
      event_date: updates.eventDate,
      date: updates.date,
      is_featured: updates.isFeatured,
      is_published: updates.isPublished,
      sort_order: updates.sortOrder,
    });

    if (response.success) {
      const albums = getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
      const updatedAlbums = albums.map((a) => (a.id === id ? { ...a, ...updates } : a));
      setLocalData(STORAGE_KEYS.albums, updatedAlbums);
      return true;
    }
  } catch (err) {
    console.warn("[PortfolioService] updatePortfolioAlbum error:", err);
  }

  // Fallback
  const albums = getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
  const updatedAlbums = albums.map((a) => (a.id === id ? { ...a, ...updates } : a));
  setLocalData(STORAGE_KEYS.albums, updatedAlbums);
  return true;
};

/**
 * Hapus album
 */
export const deletePortfolioAlbum = async (id: string): Promise<boolean> => {
  try {
    const response = await apiClient.deletePortfolio(id);
    if (response.success) {
      const albums = getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
      setLocalData(
        STORAGE_KEYS.albums,
        albums.filter((a) => a.id !== id)
      );
      return true;
    }
  } catch (err) {
    console.warn("[PortfolioService] deletePortfolioAlbum error:", err);
  }

  // Fallback
  const albums = getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
  setLocalData(
    STORAGE_KEYS.albums,
    albums.filter((a) => a.id !== id)
  );
  return true;
};

/**
 * Reorder albums (update sortOrder)
 */
export const reorderPortfolioAlbums = async (ids: string[]): Promise<boolean> => {
  try {
    for (let i = 0; i < ids.length; i++) {
      await apiClient.updatePortfolio(ids[i], { sort_order: i + 1 });
    }

    // Update localStorage cache
    const albums = getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
    const albumMap = new Map(albums.map((a) => [a.id, a]));
    const reordered = ids.map((id, index) => {
      const album = albumMap.get(id);
      return album ? { ...album, sortOrder: index + 1 } : null;
    }).filter(Boolean) as Album[];
    setLocalData(STORAGE_KEYS.albums, reordered);
    return true;
  } catch (err) {
    console.warn("[PortfolioService] reorderPortfolioAlbums error:", err);
  }

  // Fallback
  const albums = getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
  const albumMap = new Map(albums.map((a) => [a.id, a]));
  const reordered = ids.map((id, index) => {
    const album = albumMap.get(id);
    return album ? { ...album, sortOrder: index + 1 } : null;
  }).filter(Boolean) as Album[];
  setLocalData(STORAGE_KEYS.albums, reordered);
  return true;
};

// ============================================================================
// Media File Operations
// ============================================================================

/**
 * Ambil semua media files
 */
export const getMediaFiles = async (): Promise<MediaFile[]> => {
  return getLocalData<MediaFile[]>(STORAGE_KEYS.media, []);
};

/**
 * Ambil media files by album ID
 */
export const getMediaFilesByAlbum = async (albumId: string): Promise<MediaFile[]> => {
  const files = await getMediaFiles();
  return files.filter((f) => f.albumId === albumId);
};

/**
 * Ambil media by filename (for content image matching)
 */
export const getMediaByFilename = async (filename: string): Promise<MediaFile | null> => {
  const files = await getMediaFiles();
  return files.find((f) => f.filename.toLowerCase() === filename.toLowerCase()) || null;
};

/**
 * Tambah media file reference
 */
export const addMediaFile = async (
  fileData: Omit<MediaFile, "id" | "uploadedAt">
): Promise<MediaFile | null> => {
  const newFile: MediaFile = {
    ...fileData,
    id: generateId(),
    uploadedAt: new Date().toISOString(),
  };

  const files = getLocalData<MediaFile[]>(STORAGE_KEYS.media, []);
  files.unshift(newFile);
  setLocalData(STORAGE_KEYS.media, files);
  return newFile;
};

/**
 * Hapus media file
 */
export const deleteMediaFile = async (id: string): Promise<boolean> => {
  const files = getLocalData<MediaFile[]>(STORAGE_KEYS.media, []);
  setLocalData(
    STORAGE_KEYS.media,
    files.filter((f) => f.id !== id)
  );
  return true;
};

/**
 * Upload media file (untuk storage) - placeholder for file upload
 */
export const uploadMediaFile = async (file: File, albumId?: string): Promise<MediaFile | null> => {
  // Generate base64 for localStorage fallback
  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const filename = file.name;
      const type = file.type.startsWith("image/") ? "image" : "video";
      const size = file.size;

      const mediaFile = await addMediaFile({
        filename,
        url: base64,
        type,
        size,
        albumId,
      });

      resolve(mediaFile);
    };

    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// Export/Import
// ============================================================================

/**
 * Export album data ke JSON
 */
export const exportAlbumData = async (): Promise<string> => {
  const albums = await getPortfolioAlbums();
  const mediaFiles = await getMediaFiles();

  return JSON.stringify(
    {
      schema: "danivisual.portfolio.v1",
      exportedAt: new Date().toISOString(),
      albums,
      mediaFiles,
    },
    null,
    2
  );
};

/**
 * Import album data dari JSON
 */
export const importAlbumData = async (payload: string): Promise<boolean> => {
  try {
    const parsed = JSON.parse(payload);

    if (!parsed.schema?.includes("danivisual.portfolio")) {
      throw new Error("Format tidak valid");
    }

    if (parsed.albums) setLocalData(STORAGE_KEYS.albums, parsed.albums);
    if (parsed.mediaFiles) setLocalData(STORAGE_KEYS.media, parsed.mediaFiles);

    return true;
  } catch (err) {
    console.error("[PortfolioService] importAlbumData error:", err);
    return false;
  }
};
