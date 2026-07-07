const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const bucket = process.env.SUPABASE_BUCKET || 'product-photos';

// Uploads a file buffer directly to Supabase Storage's REST API and returns
// its permanent public URL. We intentionally avoid the @supabase/supabase-js
// SDK here: it initializes a realtime/websocket client on startup that isn't
// compatible with every Node runtime and can crash the whole app before it
// even starts listening on its port. A plain HTTP call is all Storage needs.
export async function uploadToSupabase(
  fileName: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      'Content-Type': mimetype,
      'x-upsert': 'true',
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase upload failed (${res.status}): ${errText}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
}
