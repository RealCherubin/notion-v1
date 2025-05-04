import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getOpenAIApiKey() {
  return import.meta.env.VITE_OPENAI_API_KEY;
}
