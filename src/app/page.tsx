import { Worksheet } from "@/components/worksheet/Worksheet";
import { hasCoachKey } from "@/lib/coach/server";
import "@/components/worksheet/worksheet.css";

export const dynamic = "force-dynamic";

export default function Home() {
  return <Worksheet aiEnabled={hasCoachKey()} />;
}
