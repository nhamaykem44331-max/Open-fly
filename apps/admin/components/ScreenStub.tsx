// Temporary placeholder body for screens not yet built in the current phase.
// Removed as each real screen lands (Queue → P1.4, Dashboard → P1.5, …).
import { T } from "@/lib/tokens";

export function ScreenStub({ note }: { note: string }) {
  return (
    <div
      style={{
        border: `1px dashed ${T.line2}`,
        borderRadius: 12,
        padding: "56px 32px",
        textAlign: "center",
        background: T.paper,
        fontFamily: T.sans,
        fontSize: 14,
        color: T.ink3,
      }}
    >
      {note}
    </div>
  );
}
