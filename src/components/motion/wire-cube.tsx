const FACES = [
  "cube-face-front",
  "cube-face-back",
  "cube-face-right",
  "cube-face-left",
  "cube-face-top",
  "cube-face-bottom",
] as const;

/**
 * A tumbling wireframe cube with a counter-rotating core.
 *
 * Six real faces in a shared preserve-3d space, so edges genuinely occlude
 * as it turns rather than reading as a spinning flat square.
 *
 * No hooks — stays a server component and ships no JavaScript.
 */
export default function WireCube({
  size = 220,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`cube-stage ${className}`}
      style={{ ["--cube-size" as string]: `${size}px` }}
    >
      <div className="cube">
        {FACES.map((face) => (
          <div key={face} className={`cube-face ${face}`} />
        ))}

        <div className="cube-inner">
          {FACES.map((face) => (
            <div key={face} className={`cube-face ${face}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
