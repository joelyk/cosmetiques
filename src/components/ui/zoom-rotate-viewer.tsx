"use client";

import Image from "next/image";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

export function ZoomRotateViewer({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = images[activeIndex] ?? images[0];

  const selectImage = (index: number) => {
    setActiveIndex(index);
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="panel overflow-hidden p-4">
      <div className="relative flex min-h-[480px] items-center justify-center overflow-hidden rounded-[32px] bg-[color:var(--card-soft)] p-6">
        <Image
          src={activeImage}
          alt={alt}
          width={720}
          height={720}
          className="h-[420px] w-full object-contain transition duration-300"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="chip inline-flex items-center gap-2"
          onClick={() => setScale((current) => Math.max(0.8, current - 0.1))}
        >
          <ZoomOut className="h-4 w-4" />
          Dezoomer
        </button>
        <button
          type="button"
          className="chip inline-flex items-center gap-2"
          onClick={() => setScale((current) => Math.min(2.2, current + 0.1))}
        >
          <ZoomIn className="h-4 w-4" />
          Zoomer
        </button>
        <button
          type="button"
          className="chip inline-flex items-center gap-2"
          onClick={() => setRotation((current) => current - 15)}
        >
          <RotateCcw className="h-4 w-4" />
          Rotation -
        </button>
        <button
          type="button"
          className="chip inline-flex items-center gap-2"
          onClick={() => setRotation((current) => current + 15)}
        >
          <RotateCw className="h-4 w-4" />
          Rotation +
        </button>
      </div>

      {images.length > 1 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={`overflow-hidden rounded-[20px] border p-2 transition ${
                index === activeIndex
                  ? "border-[color:var(--accent-strong)] bg-white"
                  : "border-[color:var(--line)] bg-[color:var(--card-soft)]"
              }`}
              onClick={() => selectImage(index)}
            >
              <Image
                src={image}
                alt={`${alt} vue ${index + 1}`}
                width={180}
                height={180}
                className="h-20 w-full object-contain"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
