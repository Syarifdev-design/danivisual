/**
 * Portfolio Service
 *
 * Mengelola operasi CRUD untuk:
 * - Portfolio Albums
 * - Media Files
 *
 * Menggunakan Supabase dengan localStorage fallback dan shared default data.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";
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
  albums: "danivisual_admin_albums",
  media: "danivisual_admin_media",
};

// ============================================================================
// Default Data from Shared Source
// ============================================================================

const defaultAlbums: Album[] = DEFAULT_PORTFOLIOS;

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2);
const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ============================================================================
// Album Operations
// ============================================================================

/**
 * Ambil semua portfolio albums
 */
export const getPortfolioAlbums = async (): Promise<Album[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("portfolio_albums")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[PortfolioService] getPortfolioAlbums error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      name: row.name,
      coupleName: row.couple_name,
      category: row.category,
      coverImage: row.cover_image,
      galleryImages: row.gallery_images,
      images: row.images || [],
      location: row.location,
      story: row.story,
      eventDate: row.event_date,
      date: row.date,
      isFeatured: row.is_featured,
      isPublished: row.is_published,
      sortOrder: row.sort_order,
    }));
  }

  return getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
};

/**
 * Ambil album by ID
 */
export const getPortfolioAlbumById = async (id: string): Promise<Album | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("portfolio_albums")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      name: data.name,
      coupleName: data.couple_name,
      category: data.category,
      coverImage: data.cover_image,
      galleryImages: data.gallery_images,
      images: data.images || [],
      location: data.location,
      story: data.story,
      eventDate: data.event_date,
      date: data.date,
      isFeatured: data.is_featured,
      isPublished: data.is_published,
      sortOrder: data.sort_order,
    };
  }

  const albums = getLocalData<Album[]>(STORAGE_KEYS.albums, defaultAlbums);
  return albums.find((a) => a.id === id) || null;
};

/**
 * Ambil album by slug
 */
export const getPortfolioAlbumBySlug = async (slug: string): Promise<Album | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("portfolio_albums")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      name: data.name,
      coupleName: data.couple_name,
      category: data.category,
      coverImage: data.cover_image,
      galleryImages: data.gallery_images,
      images: data.images || [],
      location: data.location,
      story: data.story,
      eventDate: data.event_date,
      date: data.date,
      isFeatured: data.is_featured,
      isPublished: data.is_published,
      sortOrder: data.sort_order,
    };
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

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("portfolio_albums")
      .insert({
        id: newAlbum.id,
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
      })
      .select()
      .single();

    if (error) {
      console.error("[PortfolioService] createPortfolioAlbum error:", error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      name: data.name,
      coupleName: data.couple_name,
      category: data.category,
      coverImage: data.cover_image,
      galleryImages: data.gallery_images,
      images: data.images || [],
      location: data.location,
      story: data.story,
      eventDate: data.event_date,
      date: data.date,
      isFeatured: data.is_featured,
      isPublished: data.is_published,
      sortOrder: data.sort_order,
    };
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
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.coupleName !== undefined) dbUpdates.couple_name = updates.coupleName;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage;
    if (updates.galleryImages !== undefined) dbUpdates.gallery_images = updates.galleryImages;
    if (updates.images !== undefined) dbUpdates.images = updates.images;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.story !== undefined) dbUpdates.story = updates.story;
    if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
    if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

    const { error } = await client
      .from("portfolio_albums")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("[PortfolioService] updatePortfolioAlbum error:", error);
      return false;
    }

    return true;
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
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("portfolio_albums").delete().eq("id", id);

    if (error) {
      console.error("[PortfolioService] deletePortfolioAlbum error:", error);
      return false;
    }

    return true;
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
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    // Update each album's sortOrder
    for (let i = 0; i < ids.length; i++) {
      const { error } = await client
        .from("portfolio_albums")
        .update({ sort_order: i + 1 })
        .eq("id", ids[i]);

      if (error) {
        console.error("[PortfolioService] reorderPortfolioAlbums error:", error);
        return false;
      }
    }

    return true;
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
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("media_files")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("[PortfolioService] getMediaFiles error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      filename: row.filename,
      url: row.url,
      type: row.type as MediaFile["type"],
      size: row.size,
      uploadedAt: row.uploaded_at,
      albumId: row.album_id,
    }));
  }

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

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("media_files")
      .insert({
        id: newFile.id,
        filename: newFile.filename,
        url: newFile.url,
        type: newFile.type,
        size: newFile.size,
        album_id: newFile.albumId,
        uploaded_at: newFile.uploadedAt,
      })
      .select()
      .single();

    if (error) {
      console.error("[PortfolioService] addMediaFile error:", error);
      return null;
    }

    return {
      id: data.id,
      filename: data.filename,
      url: data.url,
      type: data.type as MediaFile["type"],
      size: data.size,
      uploadedAt: data.uploaded_at,
      albumId: data.album_id,
    };
  }

  // Fallback
  const files = getLocalData<MediaFile[]>(STORAGE_KEYS.media, []);
  files.unshift(newFile);
  setLocalData(STORAGE_KEYS.media, files);
  return newFile;
};

/**
 * Hapus media file
 */
export const deleteMediaFile = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("media_files").delete().eq("id", id);

    if (error) {
      console.error("[PortfolioService] deleteMediaFile error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const files = getLocalData<MediaFile[]>(STORAGE_KEYS.media, []);
  setLocalData(
    STORAGE_KEYS.media,
    files.filter((f) => f.id !== id)
  );
  return true;
};

/**
 * Upload media file (untuk storage)
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

      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) {
          try {
            const fileName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const { error: uploadError } = await client.storage
              .from("portfolio-media")
              .upload(fileName, file);

            if (!uploadError) {
              const { data } = client.storage
                .from("portfolio-media")
                .getPublicUrl(fileName);

              const mediaFile = await addMediaFile({
                filename,
                url: data.publicUrl,
                type,
                size,
                albumId,
              });

              resolve(mediaFile);
              return;
            }
          } catch (err) {
            console.error("[PortfolioService] upload error:", err);
          }
        }
      }

      // Fallback: use base64
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