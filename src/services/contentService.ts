/**
 * Content Service
 *
 * Mengelola operasi CRUD untuk konten website (CMS).
 * Menggunakan Supabase dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

// Types
export interface ContentField {
  id: string;
  menuId: string;
  sectionId: string;
  fieldId: string;
  value: string;
  type?: "text" | "textarea" | "url" | "image" | "video" | "gallery";
  label?: string;
  updatedAt?: string;
}

export interface ContentImage {
  fieldId: string;
  url: string;
  menuId?: string;
  updatedAt?: string;
}

export interface ContentMenu {
  id: string;
  label: string;
  description: string;
  status?: "draft" | "published";
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    canonicalPath?: string;
    ogImage?: string;
  };
  updatedAt?: string;
  publishedAt?: string;
  sections?: ContentSection[];
}

export interface ContentSection {
  id: string;
  title: string;
  description: string;
  fields: ContentField[];
}

// ============================================================================
// Helper: localStorage keys
// ============================================================================

const CONTENT_KEY = "danivisual_admin_content_v1";
const IMAGE_KEY = "danivisual_admin_images_v1";

// ============================================================================
// LocalStorage Fallback Functions
// ============================================================================

const getLocalContent = (): ContentMenu[] => {
  try {
    const stored = localStorage.getItem(CONTENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getLocalImages = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(IMAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setLocalContent = (content: ContentMenu[]) => {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
};

const setLocalImages = (images: Record<string, string>) => {
  localStorage.setItem(IMAGE_KEY, JSON.stringify(images));
};

// ============================================================================
// Content Field Operations
// ============================================================================

/**
 * Ambil semua field untuk satu menu
 */
export const getContentFields = async (menuId: string): Promise<ContentField[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("content_fields")
      .select("*")
      .eq("menu_id", menuId);

    if (error) {
      console.error("[ContentService] getContentFields error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.field_id,
      menuId: row.menu_id,
      sectionId: row.section_id,
      fieldId: row.field_id,
      value: row.value || "",
      type: row.type as ContentField["type"],
      label: row.label,
      updatedAt: row.updated_at,
    }));
  }

  // Fallback: load dari localStorage
  const content = getLocalContent();
  const menu = content.find((m) => m.id === menuId);
  if (!menu) return [];

  return menu.sections?.flatMap((section) =>
    section.fields.map((field) => ({
      id: field.id,
      menuId: menu.id,
      sectionId: section.id,
      fieldId: field.id,
      value: field.value || "",
      type: field.type,
      label: field.label,
    }))
  ) || [];
};

/**
 * Ambil satu field spesifik
 */
export const getContentField = async (
  menuId: string,
  sectionId: string,
  fieldId: string
): Promise<ContentField | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("content_fields")
      .select("*")
      .eq("menu_id", menuId)
      .eq("section_id", sectionId)
      .eq("field_id", fieldId)
      .single();

    if (error || !data) return null;

    return {
      id: data.field_id,
      menuId: data.menu_id,
      sectionId: data.section_id,
      fieldId: data.field_id,
      value: data.value || "",
      type: data.type as ContentField["type"],
      label: data.label,
      updatedAt: data.updated_at,
    };
  }

  // Fallback
  const fields = await getContentFields(menuId);
  return fields.find((f) => f.sectionId === sectionId && f.fieldId === fieldId) || null;
};

/**
 * Update satu field konten
 */
export const updateContentField = async (
  menuId: string,
  sectionId: string,
  fieldId: string,
  value: string
): Promise<boolean> => {
  const timestamp = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("content_fields").upsert(
      {
        menu_id: menuId,
        section_id: sectionId,
        field_id: fieldId,
        value,
        updated_at: timestamp,
      },
      {
        onConflict: "menu_id,section_id,field_id",
      }
    );

    if (error) {
      console.error("[ContentService] updateContentField error:", error);
      return false;
    }

    // Update menu status ke draft
    await client
      .from("content_menus")
      .update({ status: "draft", updated_at: timestamp })
      .eq("id", menuId);

    return true;
  }

  // Fallback: update localStorage
  const content = getLocalContent();
  const updatedContent = content.map((menu) => {
    if (menu.id !== menuId) return menu;
    return {
      ...menu,
      status: "draft" as const,
      updatedAt: timestamp,
      sections: menu.sections?.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          fields: section.fields.map((field) =>
            field.id === fieldId ? { ...field, value } : field
          ),
        };
      }),
    };
  });

  setLocalContent(updatedContent);
  return true;
};

/**
 * Batch update multiple fields
 */
export const updateContentFields = async (
  updates: Array<{ menuId: string; sectionId: string; fieldId: string; value: string }>
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const timestamp = new Date().toISOString();
    const rows = updates.map((u) => ({
      menu_id: u.menuId,
      section_id: u.sectionId,
      field_id: u.fieldId,
      value: u.value,
      updated_at: timestamp,
    }));

    const { error } = await client.from("content_fields").upsert(rows, {
      onConflict: "menu_id,section_id,field_id",
    });

    if (error) {
      console.error("[ContentService] updateContentFields error:", error);
      return false;
    }

    // Mark affected menus as draft
    const menuIds = [...new Set(updates.map((u) => u.menuId))];
    for (const menuId of menuIds) {
      await client
        .from("content_menus")
        .update({ status: "draft", updated_at: timestamp })
        .eq("id", menuId);
    }

    return true;
  }

  // Fallback: update localStorage one by one
  for (const update of updates) {
    await updateContentField(update.menuId, update.sectionId, update.fieldId, update.value);
  }
  return true;
};

// ============================================================================
// Content Image Operations
// ============================================================================

/**
 * Ambil semua image assignments
 */
export const getContentImages = async (): Promise<ContentImage[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client.from("content_images").select("*");

    if (error) {
      console.error("[ContentService] getContentImages error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      fieldId: row.field_id,
      url: row.url,
      menuId: row.menu_id,
      updatedAt: row.updated_at,
    }));
  }

  // Fallback
  const images = getLocalImages();
  return Object.entries(images).map(([fieldId, url]) => ({
    fieldId,
    url,
  }));
};

/**
 * Ambil satu image
 */
export const getContentImage = async (fieldId: string): Promise<ContentImage | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("content_images")
      .select("*")
      .eq("field_id", fieldId)
      .single();

    if (error || !data) return null;

    return {
      fieldId: data.field_id,
      url: data.url,
      menuId: data.menu_id,
      updatedAt: data.updated_at,
    };
  }

  // Fallback
  const images = getLocalImages();
  const url = images[fieldId];
  return url ? { fieldId, url } : null;
};

/**
 * Update/assign image ke field
 */
export const updateContentImage = async (
  fieldId: string,
  url: string
): Promise<boolean> => {
  const timestamp = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("content_images").upsert(
      {
        field_id: fieldId,
        url,
        updated_at: timestamp,
      },
      {
        onConflict: "field_id",
      }
    );

    if (error) {
      console.error("[ContentService] updateContentImage error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const images = getLocalImages();
  images[fieldId] = url;
  setLocalImages(images);
  return true;
};

/**
 * Hapus image assignment
 */
export const deleteContentImage = async (fieldId: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client
      .from("content_images")
      .delete()
      .eq("field_id", fieldId);

    if (error) {
      console.error("[ContentService] deleteContentImage error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const images = getLocalImages();
  delete images[fieldId];
  setLocalImages(images);
  return true;
};

/**
 * Upload image file (base64 atau storage URL)
 */
export const uploadContentImage = async (
  fieldId: string,
  file: File
): Promise<string | null> => {
  // Convert to base64 for localStorage
  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;

      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) {
          try {
            const fileName = `${fieldId}_${Date.now()}.${file.name.split(".").pop()}`;
            const { error: uploadError } = await client.storage
              .from("content-images")
              .upload(fileName, file);

            if (!uploadError) {
              const { data } = client.storage
                .from("content-images")
                .getPublicUrl(fileName);

              await updateContentImage(fieldId, data.publicUrl);
              resolve(data.publicUrl);
              return;
            }
          } catch (err) {
            console.error("[ContentService] upload error:", err);
          }
        }
      }

      // Fallback: use base64
      await updateContentImage(fieldId, base64);
      resolve(base64);
    };

    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// Content Menu Operations
// ============================================================================

/**
 * Ambil semua menu
 */
export const getContentMenus = async (): Promise<ContentMenu[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("content_menus")
      .select("*")
      .order("id");

    if (error) {
      console.error("[ContentService] getContentMenus error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      label: row.label,
      description: row.description || "",
      status: row.status as ContentMenu["status"],
      seo: row.seo,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    }));
  }

  // Fallback
  const content = getLocalContent();
  return content.map((menu) => ({
    id: menu.id,
    label: menu.label,
    description: menu.description,
    status: menu.status,
    seo: menu.seo,
    updatedAt: menu.updatedAt,
    publishedAt: menu.publishedAt,
  }));
};

/**
 * Publish menu (set status = published)
 */
export const publishContentMenu = async (menuId: string): Promise<boolean> => {
  const timestamp = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client
      .from("content_menus")
      .update({
        status: "published",
        updated_at: timestamp,
        published_at: timestamp,
      })
      .eq("id", menuId);

    if (error) {
      console.error("[ContentService] publishContentMenu error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const content = getLocalContent();
  const updatedContent = content.map((menu) =>
    menu.id === menuId
      ? { ...menu, status: "published" as const, updatedAt: timestamp, publishedAt: timestamp }
      : menu
  );
  setLocalContent(updatedContent);
  return true;
};

// ============================================================================
// Backup / Export Functions
// ============================================================================

/**
 * Export semua konten ke JSON
 */
export const exportContentBackup = async (): Promise<string> => {
  const content = getLocalContent();
  const images = getLocalImages();

  return JSON.stringify(
    {
      schema: "danivisual.cms.backup.v1",
      exportedAt: new Date().toISOString(),
      content,
      images,
    },
    null,
    2
  );
};

/**
 * Import konten dari JSON backup
 */
export const importContentBackup = async (payload: string): Promise<boolean> => {
  try {
    const parsed = JSON.parse(payload);

    if (parsed.schema !== "danivisual.cms.backup.v1" || !Array.isArray(parsed.content)) {
      throw new Error("Format backup tidak valid");
    }

    if (parsed.content) setLocalContent(parsed.content);
    if (parsed.images) setLocalImages(parsed.images || {});

    return true;
  } catch (err) {
    console.error("[ContentService] importBackup error:", err);
    return false;
  }
};

// ============================================================================
// Sync Functions (for future use)
// ============================================================================

/**
 * Sinkronkan localStorage ke Supabase (one-time migration)
 */
export const syncLocalToSupabase = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, message: "Supabase not configured" };
  }

  try {
    const content = getLocalContent();
    const images = getLocalImages();

    // Insert menus
    for (const menu of content) {
      const { error: menuError } = await getSupabaseClient()!
        .from("content_menus")
        .upsert(
          {
            id: menu.id,
            label: menu.label,
            description: menu.description,
            status: menu.status || "published",
            seo: menu.seo,
            updated_at: menu.updatedAt,
            published_at: menu.publishedAt,
          },
          { onConflict: "id" }
        );

      if (menuError) throw menuError;

      // Insert fields
      const fields = menu.sections?.flatMap((section) =>
        section.fields.map((field) => ({
          menu_id: menu.id,
          section_id: section.id,
          field_id: field.id,
          value: field.value,
          type: field.type,
          label: field.label,
          updated_at: menu.updatedAt,
        }))
      );

      if (fields?.length) {
        const { error: fieldsError } = await getSupabaseClient()!
          .from("content_fields")
          .upsert(fields, { onConflict: "menu_id,section_id,field_id" });

        if (fieldsError) throw fieldsError;
      }
    }

    // Insert images
    const imageRows = Object.entries(images).map(([fieldId, url]) => ({
      field_id: fieldId,
      url,
      updated_at: new Date().toISOString(),
    }));

    if (imageRows.length) {
      const { error: imagesError } = await getSupabaseClient()!
        .from("content_images")
        .upsert(imageRows, { onConflict: "field_id" });

      if (imagesError) throw imagesError;
    }

    return { success: true, message: "Sync completed successfully" };
  } catch (err) {
    console.error("[ContentService] syncLocalToSupabase error:", err);
    return { success: false, message: `Sync failed: ${err}` };
  }
};