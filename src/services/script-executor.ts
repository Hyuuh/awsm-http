import { RequestData, ResponseData } from "@/types";
import { getFaker } from "@/services/faker-service";

interface ScriptContext {
  request?: RequestData;
  response?: ResponseData;
  variables: Record<string, string>;
  fakerLocale?: string;
}

interface ScriptResult {
  variables: Record<string, string>;
  logs: string[];
  error?: string;
}

export class ScriptExecutor {
  static execute(script: string, context: ScriptContext): ScriptResult {
    if (!script || script.trim() === "") {
      return { variables: context.variables, logs: [] };
    }

    const logs: string[] = [];
    const variables = { ...context.variables };
    const faker = getFaker(context.fakerLocale || "en");

    const awsm = {
      variables: {
        get: (key: string) => variables[key],
        set: (key: string, value: string) => {
          variables[key] = value;
        },
      },
      log: (...args: any[]) => {
        logs.push(args.map((a) => String(a)).join(" "));
      },
      faker: faker,
      request: context.request,
      response: context.response,
    };

    try {
      // Wrap in an async function to allow await if needed (though we run it synchronously here mostly)
      // We use new Function to create a sandbox-like scope
      const func = new Function("awsm", script);
      func(awsm);
    } catch (err: any) {
      return {
        variables,
        logs,
        error: err.message || "Unknown script error",
      };
    }

    return { variables, logs };
  }
}
