import { randomUUID } from "node:crypto";

import { auth } from "@/auth";
import { canManageCatalog } from "@/lib/roles";
import { createSupabaseAdminClient } from "@/lib/supabase";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const BUCKET_NAME = "product-images";

export async function POST(request: Request) {
  const session = await auth();

  if (!canManageCatalog(session?.user?.role ?? "guest")) {
    return Response.json({ error: "Acces refuse." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return Response.json(
      {
        error:
          "Configuration manquante. Ajoute NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const productName = String(formData.get("productName") ?? "produit");
  const variant = String(formData.get("variant") ?? "gallery");

  if (!(file instanceof File)) {
    return Response.json({ error: "Aucun fichier image recu." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return Response.json(
      { error: "Formats autorises: JPG, PNG, WEBP ou SVG." },
      { status: 400 },
    );
  }

  if (file.size > 8 * 1024 * 1024) {
    return Response.json(
      { error: "Le fichier depasse la limite de 8 Mo." },
      { status: 400 },
    );
  }

  const createBucketResult = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
    allowedMimeTypes: [...allowedTypes],
  });

  if (createBucketResult.error && createBucketResult.error.message !== "The resource already exists") {
    return Response.json(
      { error: "Impossible de preparer le stockage image." },
      { status: 500 },
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${slugify(productName) || "produit"}-${variant}-${randomUUID()}.${extension}`;
  const filePath = `${variant}/${fileName}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadResult.error) {
    return Response.json(
      { error: "Impossible de televerser cette image." },
      { status: 500 },
    );
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return Response.json({
    ok: true,
    url: data.publicUrl,
    path: filePath,
  });
}
