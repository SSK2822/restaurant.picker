import { useEffect, useRef, useState } from "react";
import { useAnimate } from "framer-motion";
import type { Place } from "../lib/types";

const ITEM_HEIGHT = 72; // px, must match the rendered row height
const VISIBLE_ROWS = 5;
const REEL_REPEATS = 6; // how many times we duplicate the list to give the reel "depth"

interface Props {
  places: Place[];
  spinKey: number; // change to trigger a fresh spin
  onLanded: (place: Place) => void;
}

/**
 * A vertical slot-machine reel that spins through place names and lands on a
 * randomly chosen one. The animation eases out (fast start, slow end) so the
 * landing feels deliberate.
 */
export default function SpinWheel({ places, spinKey, onLanded }: Props) {
  const [scope, animate] = useAnimate();
  const reelRef = useRef<HTMLDivElement | null>(null);
  const [, setSpinning] = useState(false);

  useEffect(() => {
    if (places.length === 0) return;
    const targetIdx = Math.floor(Math.random() * places.length);
    const finalIndex = (REEL_REPEATS - 1) * places.length + targetIdx;
    const centerOffset = (VISIBLE_ROWS - 1) / 2;
    const finalY = -(finalIndex - centerOffset) * ITEM_HEIGHT;

    setSpinning(true);
    // Reset to top before each new spin
    if (reelRef.current) reelRef.current.style.transform = "translateY(0px)";

    animate(
      scope.current,
      { y: finalY },
      { duration: 3.6, ease: [0.12, 0.7, 0.1, 1] }
    ).then(() => {
      setSpinning(false);
      onLanded(places[targetIdx]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey]);

  if (places.length === 0) return null;

  // Build the reel: repeat the list REEL_REPEATS times so we always have room
  // to scroll past the visible window.
  const reelItems: Place[] = [];
  for (let i = 0; i < REEL_REPEATS; i++) reelItems.push(...places);

  return (
    <div
      className="reel-mask relative w-full max-w-md mx-auto overflow-hidden rounded-3xl bg-white/80 border border-sun-200 shadow-cozy"
      style={{ height: ITEM_HEIGHT * VISIBLE_ROWS }}
    >
      {/* Center highlight band */}
      <div
        className="pointer-events-none absolute left-0 right-0 border-y-2 border-sun-300 bg-sun-100/70"
        style={{
          top: ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
        }}
      />
      <div ref={scope}>
        <div ref={reelRef}>
          {reelItems.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-center px-6 text-center font-display text-xl font-bold text-sun-900"
              style={{ height: ITEM_HEIGHT }}
            >
              <span className="truncate">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
