import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { supabase, ExtractedFile } from "@/lib/supabase";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = ["application/zip", "application/x-zip-compressed", "application/gzip", "application/x-tar", "application/x-gzip"];

async function extractZip(buffer: ArrayBuffer): Promise<ExtractedFile[]> {
  const zip = new JSZip();
  const loaded = await zip.loadAsync(buffer);
  const files: ExtractedFile[] = [];

  for (const [path, file] of Object.entries(loaded.files)) {
    if (file.dir) {
      files.push({ path, size: 0, isDirectory: true });
    } else {
      const content = await file.async("text");
      files.push({
        path,
        size: content.length,
        isDirectory: false,
        content: content.length < 100000 ? content : undefined,
      });
    }
  }
  return files;
}

async function extractTar(buffer: ArrayBuffer): Promise<ExtractedFile[]> {
  const files: ExtractedFile[] = [];
  const uint8 = new Uint8Array(buffer);
  
  let offset = 0;
  while (offset < uint8.length - 512) {
    const header = uint8.slice(offset, offset + 512);
    if (header.every(b => b === 0)) break;
    
    const nameBytes = header.slice(0, 100);
    let name = "";
    for (let i = 0; i < nameBytes.length && nameBytes[i] !== 0; i++) {
      name += String.fromCharCode(nameBytes[i]);
    }
    
    const sizeStr = Array.from(header.slice(124, 136))
      .map(b => String.fromCharCode(b))
      .join("")
      .trim();
    const size = parseInt(sizeStr, 8) || 0;
    
    const typeFlag = header[156];
    const isDirectory = typeFlag === 53 || name.endsWith("/");
    
    if (name && name !== "pax_global_header") {
      if (isDirectory) {
        files.push({ path: name, size: 0, isDirectory: true });
      } else {
        const contentStart = offset + 512;
        const contentBytes = uint8.slice(contentStart, contentStart + size);
        let content = "";
        try {
          content = new TextDecoder().decode(contentBytes);
        } catch {
          content = "";
        }
        files.push({
          path: name,
          size,
          isDirectory: false,
          content: size < 100000 ? content : undefined,
        });
      }
    }
    
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  
  return files;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    let extractedFiles: ExtractedFile[] = [];
    let fileType = "unknown";

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".zip")) {
      fileType = "zip";
      extractedFiles = await extractZip(buffer);
    } else if (fileName.endsWith(".tar") || fileName.endsWith(".tar.gz") || fileName.endsWith(".tgz")) {
      fileType = "tar";
      if (fileName.endsWith(".gz") || fileName.endsWith(".tgz")) {
        const ds = new DecompressionStream("gzip");
        const decompressed = new Response(new Blob([buffer]).stream().pipeThrough(ds));
        const decompressedBuffer = await decompressed.arrayBuffer();
        extractedFiles = await extractTar(decompressedBuffer);
      } else {
        extractedFiles = await extractTar(buffer);
      }
    } else {
      return NextResponse.json({ error: "Unsupported file type. Use .zip, .tar, or .tar.gz" }, { status: 400 });
    }

    const { data: upload, error } = await supabase
      .from("uploads")
      .insert({
        user_id: session.user.id,
        original_filename: file.name,
        file_type: fileType,
        file_size: file.size,
        extracted_files: extractedFiles,
        status: "extracted",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to save upload" }, { status: 500 });
    }

    return NextResponse.json({
      uploadId: upload.id,
      files: extractedFiles,
      totalFiles: extractedFiles.filter(f => !f.isDirectory).length,
      totalDirectories: extractedFiles.filter(f => f.isDirectory).length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: uploads, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 });
    }

    return NextResponse.json({ uploads });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
