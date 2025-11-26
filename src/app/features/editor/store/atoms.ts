import type { ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";

// Atom can contain either ReactFlowInstance or null
export const editorAtom = atom<ReactFlowInstance | null>(null);
