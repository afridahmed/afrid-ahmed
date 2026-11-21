import { supabase } from '../lib/supabase';
import { classifySupabaseError, verifyAdminSession } from './cmsAuthService';

// =============================================================================
// DATABASE RECORD INTERFACE (public.media)
// =============================================================================

export interface DbMediaItem {
  id: string;
  bucket: string;
  file_path: string;
  public_url: string;
  file_name: string;
  media_type: string;
  file_size_bytes: number;
  alt_text?: string;
  created_at?: string;
}

export interface MediaUploadOptions {
  folder?: 'hero' | 'about' | 'general' | string;
  altText?: string;
}

export interface MediaUsageReference {
  isReferenced: boolean;
  locations: {
    section: 'Hero' | 'About' | 'Projects' | 'Creator';
    field: string;
    details: string;
  }[];
}

export const STORAGE_BUCKET = 'portfolio-media';
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
export const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// =============================================================================
// STORAGE BUCKET INITIALIZATION HELPER
// =============================================================================

/**
 * Checks if the portfolio-media bucket exists. If not, attempts creation.
 */
export async function ensureMediaBucketExists(): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      // Non-blocking warning since bucket might already exist and listBuckets might be restricted
      return { success: true, error: null };
    }

    const exists = buckets?.some(b => b.name === STORAGE_BUCKET || b.id === STORAGE_BUCKET);
    if (!exists) {
      const { error: createErr } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE_BYTES,
        allowedMimeTypes: ACCEPTED_MIME_TYPES,
      });

      if (createErr && !createErr.message?.includes('already exists')) {
        console.warn('Storage bucket creation note:', createErr.message);
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.warn('Bucket ensure check note:', err);
    return { success: true, error: null };
  }
}

// =============================================================================
// MEDIA CRUD OPERATIONS
// =============================================================================

/**
 * Fetch all media records from public.media sorted by created_at DESC.
 */
export async function getAdminMediaItems(): Promise<{ data: DbMediaItem[]; error: string | null }> {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return { data: [], error: auth.error || 'Administrator authorization required.' };
    }

    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const classified = classifySupabaseError(error, 'loading Media library');
      return { data: [], error: classified.message };
    }

    return { data: (data as DbMediaItem[]) || [], error: null };
  } catch (err) {
    const classified = classifySupabaseError(err, 'loading Media library');
    return { data: [], error: classified.message };
  }
}

/**
 * Upload an image file to Supabase Storage and record its metadata in public.media.
 */
export async function uploadAdminMedia(
  file: File,
  options: MediaUploadOptions = {}
): Promise<{ data: DbMediaItem | null; error: string | null }> {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return {
        data: null,
        error: `${auth.error || 'Administrator authorization required.'} Your existing image has been preserved.`,
      };
    }

    // 1. Validation: File size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        data: null,
        error: `File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB). Your existing image has been preserved.`,
      };
    }

    // 2. Validation: File MIME type
    if (!ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return {
        data: null,
        error: `Unsupported file format (${file.type || 'unknown'}). Please upload JPG, PNG, or WebP. Your existing image has been preserved.`,
      };
    }

    // 3. Ensure bucket exists
    await ensureMediaBucketExists();

    // 4. Generate unique clean filename
    const folder = options.folder || 'general';
    const originalName = file.name;
    const extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase() || '.jpg';
    const cleanBaseName = originalName
      .substring(0, originalName.lastIndexOf('.'))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const uniqueFileName = `${cleanBaseName}-${timestamp}-${randomSuffix}${extension}`;
    const storagePath = `${folder}/${uniqueFileName}`;

    // 5. Upload object to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      const classified = classifySupabaseError(uploadError, 'uploading image to storage');
      return { data: null, error: `${classified.message} Your existing image has been preserved.` };
    }

    // 6. Obtain Public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl || '';
    if (!publicUrl) {
      return { data: null, error: 'Failed to generate public URL for uploaded media. Your existing image has been preserved.' };
    }

    // 7. Derive sensible Alt Text if not provided
    const altText = options.altText?.trim() || cleanBaseName.replace(/-/g, ' ');

    // 8. Insert record into public.media
    const mediaRecord: Omit<DbMediaItem, 'id' | 'created_at'> & { id?: string } = {
      bucket: STORAGE_BUCKET,
      file_path: storagePath,
      public_url: publicUrl,
      file_name: originalName,
      media_type: file.type,
      file_size_bytes: file.size,
      alt_text: altText,
    };

    const { data: insertedData, error: dbError } = await supabase
      .from('media')
      .insert(mediaRecord)
      .select()
      .single();

    if (dbError) {
      // Attempt storage rollback to keep state clean
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      const classified = classifySupabaseError(dbError, 'saving media metadata');
      return { data: null, error: `${classified.message} Your existing image has been preserved.` };
    }

    return { data: insertedData as DbMediaItem, error: null };
  } catch (err) {
    const classified = classifySupabaseError(err, 'uploading image');
    return { data: null, error: `${classified.message} Your existing image has been preserved.` };
  }
}

/**
 * Check whether a media URL or file path is referenced by hero_content or about_content.
 */
export async function checkMediaReferences(
  mediaItem: DbMediaItem
): Promise<MediaUsageReference> {
  const reference: MediaUsageReference = {
    isReferenced: false,
    locations: [],
  };

  try {
    const url = mediaItem.public_url;
    const path = mediaItem.file_path;

    // Check Hero Content
    const { data: heroData } = await supabase
      .from('hero_content')
      .select('id, hero_image_url')
      .eq('id', 'global')
      .maybeSingle();

    if (heroData?.hero_image_url && (heroData.hero_image_url === url || heroData.hero_image_url.includes(path))) {
      reference.isReferenced = true;
      reference.locations.push({
        section: 'Hero',
        field: 'Profile Photo (hero_image_url)',
        details: 'Currently active as the main Hero profile image',
      });
    }

    // Check About Content (Portrait + Signature)
    const { data: aboutData } = await supabase
      .from('about_content')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (aboutData?.about_image_url && (aboutData.about_image_url === url || aboutData.about_image_url.includes(path))) {
      reference.isReferenced = true;
      reference.locations.push({
        section: 'About',
        field: 'Portrait Photo (about_image_url)',
        details: 'Currently active as the portrait in About Section',
      });
    }

    if (aboutData?.signature_image_url && (aboutData.signature_image_url === url || aboutData.signature_image_url.includes(path))) {
      reference.isReferenced = true;
      reference.locations.push({
        section: 'About',
        field: 'Signature Graphic (signature_image_url)',
        details: 'Currently active as the profile signature in About Section',
      });
    }

    return reference;
  } catch (err) {
    console.warn('Reference safety check note:', err);
    return reference;
  }
}

/**
 * Deletes a media item from Supabase Storage and public.media after reference verification.
 */
export async function deleteAdminMedia(
  mediaItem: DbMediaItem
): Promise<{ success: boolean; error: string | null; isBlocked?: boolean }> {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return { success: false, error: auth.error || 'Administrator authorization required.' };
    }

    // 1. Safety verification: verify no active references in Hero or About
    const usage = await checkMediaReferences(mediaItem);
    if (usage.isReferenced) {
      const locationNames = usage.locations.map(l => `${l.section} (${l.field})`).join(', ');
      return {
        success: false,
        error: `Cannot delete image: It is currently active in ${locationNames}. Please replace or remove the image in that section first.`,
        isBlocked: true,
      };
    }

    // 2. Delete database record in public.media first so permission errors abort before deleting storage blob
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaItem.id);

    if (dbError) {
      const classified = classifySupabaseError(dbError, 'removing media record');
      return { success: false, error: classified.message };
    }

    // 3. Delete object from Supabase Storage bucket
    const { error: storageError } = await supabase.storage
      .from(mediaItem.bucket || STORAGE_BUCKET)
      .remove([mediaItem.file_path]);

    if (storageError) {
      console.warn('Storage removal note:', storageError.message);
    }

    return { success: true, error: null };
  } catch (err) {
    const classified = classifySupabaseError(err, 'deleting media item');
    return { success: false, error: classified.message };
  }
}

/**
 * Update media metadata (such as alt text).
 */
export async function updateAdminMediaAltText(
  id: string,
  altText: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return { success: false, error: auth.error || 'Administrator authorization required.' };
    }

    const { error } = await supabase
      .from('media')
      .update({ alt_text: altText })
      .eq('id', id);

    if (error) {
      const classified = classifySupabaseError(error, 'updating media alt text');
      return { success: false, error: classified.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const classified = classifySupabaseError(err, 'updating media alt text');
    return { success: false, error: classified.message };
  }
}
