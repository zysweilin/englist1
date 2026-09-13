import { notFound } from "next/navigation";
import { getShadowing, neighbors } from "@/lib/curriculum";
import { ShadowingPractice } from "@/components/practice/ShadowingPractice";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShadowingPage({ params }: Props) {
  const { id } = await params;
  const item = getShadowing(id);
  if (!item) notFound();
  const { prev, next } = neighbors("shadowing", item.level, item.id);
  return <ShadowingPractice item={item} prevId={prev} nextId={next} />;
}
