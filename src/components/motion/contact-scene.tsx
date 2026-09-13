/**
 * The moving backdrop for the gold contact panel.
 *
 * A grid plane rakes away toward a horizon while weight-plate discs tumble in
 * 3D above it. Everything is drawn in black at low alpha: the panel is the
 * brightest surface on the page and carries black type plus form fields, so
 * depth here has to come from shadow, never from added light.
 *
 * Purely decorative — aria-hidden and pointer-events-none, so it never
 * intercepts a tap meant for the form. No hooks, so it stays a server
 * component and ships no JavaScript.
 */
export default function ContactScene() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Lifts the flat gold into a lit surface. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_0%,rgba(255,255,255,0.28),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_95%_108%,rgba(0,0,0,0.12),transparent_60%)]" />

      {/* Receding floor */}
      <div className="grid-stage">
        <div className="grid-plane">
          <div className="grid-lines" />
        </div>
      </div>

      {/* Tumbling plates */}
      <div className="disc-stage absolute inset-0">
        <div
          className="disc drift-x left-[6%] top-[14%] h-40 w-40 sm:h-56 sm:w-56"
          style={
            {
              "--disc-duration": "30s",
              "--disc-delay": "-4s",
            } as React.CSSProperties
          }
        />

        <div
          className="disc left-[52%] top-[6%] hidden h-24 w-24 lg:block"
          style={
            {
              "--disc-duration": "22s",
              "--disc-delay": "-11s",
            } as React.CSSProperties
          }
        />

        <div
          className="disc drift-x bottom-[8%] right-[8%] h-32 w-32 sm:h-44 sm:w-44"
          style={
            {
              "--disc-duration": "26s",
              "--disc-delay": "-7s",
            } as React.CSSProperties
          }
        />
      </div>

      {/* Softens the floor into the section edge. */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#d4af37] to-transparent" />
    </div>
  );
}
