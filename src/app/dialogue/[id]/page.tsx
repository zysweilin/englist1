import { notFound } from "next/navigation";
import { getDialogue, neighbors } from "@/lib/curriculum";
import { DialoguePractice } from "@/components/practice/DialoguePractice";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DialoguePage({ params }: Props) {
  const { id } = await params;
  const item = getDialogue(id);
  if (!item) notFound();
  const { prev, next } = neighbors("dialogue", item.level, item.id);
  return <DialoguePractice item={item} prevId={prev} nextId={next} />;
}
