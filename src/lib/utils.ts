import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getFaker } from "@/services/faker-service";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function substituteVariables(
  text: string,
  variables: Record<string, string>,
  fakerLocale: string = "en"
): string {
  if (!text) return text;

  // First pass: Substitute environment variables and faker variables
  return text.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const trimmedKey = key.trim();

    if (trimmedKey.startsWith("faker.")) {
      try {
        const faker = getFaker(fakerLocale);
        const parts = trimmedKey.split(".").slice(1); // Remove 'faker'

        // Traverse the faker object
        let current: any = faker;
        for (const part of parts) {
          if (current[part] === undefined) {
            return `{{${trimmedKey}}}`; // Invalid path
          }
          current = current[part];
        }

        // Execute if it's a function
        if (typeof current === "function") {
          return current();
        } else {
          return String(current);
        }
      } catch (e) {
        return `{{${trimmedKey}}}`; // Error executing
      }
    }

    const value = variables[trimmedKey];
    return value !== undefined ? value : `{{${trimmedKey}}}`;
  });
}
