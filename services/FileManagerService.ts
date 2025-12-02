
export async function uploadFile(data: any, fileType: string, file: any) {

  try {
    // 2️⃣ Request signed upload URL
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileType, upload_file_name: file.name }),
    });

    const { signedUrl } = await res.json();

    if (!signedUrl) throw new Error("Failed to get signed URL");

    console.log("Signed URL: ", signedUrl);

    // 3️⃣ Upload directly to Supabase
    const blob = new Blob([data], { type: "text/csv" });
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": "text/csv" },
      body: blob,
    });

    if(uploadRes.ok){
      return {
        status: true,
        result: uploadRes
      }
    }

    return {
      status: false,
      result: null
    }

  } catch (error) {
    return {
      status: false,
      error: error
    }    
  }

}