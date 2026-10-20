import type { CoachSentence } from "./contracts";

export type PracticeTake = {
  id: string;
  version: 1;
  createdAt: string;
  durationMs: number;
  audio: Blob;
  mimeType: string;
  purpose: "dictation" | "practice";
  reference: CoachSentence | null;
  transcript: string | null;
  assessment: null;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("englist-practice", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("takes", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("录音存储被另一页面占用"));
  });
}

export async function loadTakes(): Promise<PracticeTake[]> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("takes").objectStore("takes").getAll();
      request.onsuccess = () => resolve((request.result as PracticeTake[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function saveTake(take: PracticeTake) {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("takes", "readwrite");
      const store = transaction.objectStore("takes");
      store.put(take);
      const request = store.getAll();
      request.onsuccess = () => {
        const takes = (request.result as PracticeTake[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        for (const old of takes.slice(10)) store.delete(old.id);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

export async function deleteTake(id: string) {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("takes", "readwrite");
      transaction.objectStore("takes").delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

export function audioExtension(mime: string) {
  return mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : mime.includes("mpeg") ? "mp3" : "webm";
}
