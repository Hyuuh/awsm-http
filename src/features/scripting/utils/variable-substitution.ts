import { getFaker } from "@/features/scripting/services/faker-service";

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
        // Use new Function to allow function calls with arguments
        // e.g. faker.internet.username({ firstName: 'Jeanne' })
        const fn = new Function("faker", `return ${trimmedKey}`);
        let result = fn(faker);

        // If the user just referenced the function without calling it, call it now
        if (typeof result === "function") {
          result = result();
        }

        return String(result);
      } catch (e) {
        return `{{${trimmedKey}}}`; // Error executing or invalid path
      }
    }
    const value = variables[trimmedKey];
    return value !== undefined ? value : `{{${trimmedKey}}}`;
  });
}
