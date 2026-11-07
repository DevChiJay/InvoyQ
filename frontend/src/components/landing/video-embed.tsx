"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface VideoEmbedProps {
  videoId: string;
  title: string;
}

/**
 * Click-to-load YouTube embed: shows a lightweight placeholder and only loads
 * YouTube's player (hundreds of KB of script) when someone presses play.
 */
export default function VideoEmbed({ videoId, title }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-foreground shadow-frame">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-3 text-background focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Play className="ml-1 size-7" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium">Play: {title}</span>
        </button>
      )}
    </div>
  );
}
