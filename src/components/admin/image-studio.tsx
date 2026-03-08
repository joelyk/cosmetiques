"use client";

import { useState } from "react";
import { Download, ImagePlus, Scissors } from "lucide-react";

type ImageStudioResult = {
  name: string;
  url: string;
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Impossible de charger l'image."));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });

const getAverageCornerColor = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
) => {
  const samplePoints = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  const total = samplePoints.reduce(
    (color, [x, y]) => {
      const offset = (y * width + x) * 4;
      return {
        red: color.red + data[offset],
        green: color.green + data[offset + 1],
        blue: color.blue + data[offset + 2],
      };
    },
    { red: 0, green: 0, blue: 0 },
  );

  return {
    red: total.red / samplePoints.length,
    green: total.green / samplePoints.length,
    blue: total.blue / samplePoints.length,
  };
};

export function ImageStudio() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ImageStudioResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState(42);

  const sourceName =
    sourceFile?.name.replace(/\.[^.]+$/, "") ?? "josy-cosmetics-product";

  const handleFileChange = async (file: File | null) => {
    setSourceFile(file);
    setResult(null);
    setStatus(null);

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
  };

  const compressImage = async () => {
    if (!sourceFile) {
      setStatus("Charge d'abord une image.");
      return;
    }

    const image = await loadImage(sourceFile);
    const canvas = document.createElement("canvas");
    const maxWidth = 1400;
    const ratio = Math.min(1, maxWidth / image.width);

    canvas.width = Math.round(image.width * ratio);
    canvas.height = Math.round(image.height * ratio);

    const context = canvas.getContext("2d");
    if (!context) {
      setStatus("Canvas indisponible.");
      return;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/jpeg", 0.82);

    setResult({ name: `${sourceName}-compressed.jpg`, url });
    setStatus("Version compressée prête.");
  };

  const removePlainBackground = async () => {
    if (!sourceFile) {
      setStatus("Charge d'abord une image.");
      return;
    }

    const image = await loadImage(sourceFile);
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext("2d");
    if (!context) {
      setStatus("Canvas indisponible.");
      return;
    }

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const background = getAverageCornerColor(
      imageData.data,
      canvas.width,
      canvas.height,
    );

    for (let index = 0; index < imageData.data.length; index += 4) {
      const delta =
        Math.abs(imageData.data[index] - background.red) +
        Math.abs(imageData.data[index + 1] - background.green) +
        Math.abs(imageData.data[index + 2] - background.blue);

      if (delta / 3 <= tolerance) {
        imageData.data[index + 3] = 0;
      }
    }

    context.putImageData(imageData, 0, 0);
    const url = canvas.toDataURL("image/png");

    setResult({ name: `${sourceName}-transparent.png`, url });
    setStatus(
      "Fond uniforme supprimé. Pour les fonds complexes, il faudra brancher un moteur IA dédié plus tard.",
    );
  };

  const downloadResult = () => {
    if (!result) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = result.name;
    anchor.click();
  };

  return (
    <section className="panel p-6">
      <div>
        <p className="eyebrow">Image studio</p>
        <h2 className="mt-2 text-2xl font-semibold">
          Compression et nettoyage image produit
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-[color:var(--muted)]">
          Outil gratuit intégré au navigateur admin. Il compresse les images et
          retire bien les fonds unis. Pour un enfant ou un arrière-plan complexe,
          il faudra brancher un service IA spécialisé dans une phase suivante.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-[color:var(--line)] bg-[color:var(--card-soft)] p-6 text-center">
            <ImagePlus className="h-8 w-8 text-[color:var(--accent-strong)]" />
            <span className="mt-3 text-sm font-medium">
              Charger une image produit
            </span>
            <span className="mt-2 text-xs text-[color:var(--muted)]">
              PNG, JPG ou WEBP
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />
          </label>

          <label className="field">
            <span>Tolérance de suppression du fond</span>
            <input
              type="range"
              min="10"
              max="120"
              value={tolerance}
              onChange={(event) => setTolerance(Number(event.target.value))}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void compressImage()}
            >
              Compresser image
            </button>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => void removePlainBackground()}
            >
              <Scissors className="h-4 w-4" />
              Retirer le fond uni
            </button>
            <button
              type="button"
              className="chip inline-flex items-center gap-2"
              onClick={downloadResult}
              disabled={!result}
            >
              <Download className="h-4 w-4" />
              Télécharger
            </button>
          </div>

          {status ? (
            <p className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--muted)]">
              {status}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-4">
            <p className="text-sm font-medium">Original</p>
            <div className="mt-4 flex min-h-72 items-center justify-center rounded-[24px] bg-[color:var(--card-soft)] p-4">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Prévisualisation originale"
                  className="max-h-64 w-full object-contain"
                />
              ) : (
                <p className="text-sm text-[color:var(--muted)]">Aucune image</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-4">
            <p className="text-sm font-medium">Résultat</p>
            <div className="mt-4 flex min-h-72 items-center justify-center rounded-[24px] bg-[linear-gradient(45deg,#fff_25%,#f3e7dd_25%,#f3e7dd_50%,#fff_50%,#fff_75%,#f3e7dd_75%,#f3e7dd_100%)] bg-[length:24px_24px] p-4">
              {result ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.url}
                  alt="Prévisualisation traitée"
                  className="max-h-64 w-full object-contain"
                />
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  Le rendu apparaîtra ici
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
