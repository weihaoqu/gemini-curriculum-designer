import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Prepend Next.js basePath to a URL path (for fetch, iframe, etc.) */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  return `${base}${path}`
}
