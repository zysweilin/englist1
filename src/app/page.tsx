import { Worksheet } from "@/components/worksheet/Worksheet";
import { hasCoachKey } from "@/lib/coach/server";
import { usesChatGPTPlan } from "@/lib/coach/chatgpt-policy";
import "@/components/worksheet/worksheet.css";

export const dynamic = "force-dynamic";

export default function Home() {
  const chatgptPlan = usesChatGPTPlan();
  return <Worksheet aiEnabled={!chatgptPlan && hasCoachKey()} chatgptPlan={chatgptPlan} />;
}
