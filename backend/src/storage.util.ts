import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const bucket = process.env.SUPABASE_BUCKET || 'product-photos';

const supabase = createClient(supabaseUrl, supabaseKey);

// Uploads a file buffer to Supabase Storage and returns its permanent public URL.
export async function uploadToSupabase(
  fileName: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, { contentType: mimetype, upsert: true });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}
