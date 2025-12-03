import { useState, useMemo } from "react";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import { HttpClient } from "@/features/network/services/http-client";
import { ScriptExecutor } from "@/features/scripting/services/script-executor";
import { substituteVariables } from "@/features/scripting/utils/variable-substitution";
import { toast } from "sonner";
import { RequestData } from "@/types";

export function useRequestExecution(
  activeRequestId: string | null,
  nodeData: RequestData | undefined
) {
  const [isLoading, setIsLoading] = useState(false);
  const setResponse = useWorkspaceStore((state) => state.setResponse);
  const addToHistory = useWorkspaceStore((state) => state.addToHistory);
  const environments = useWorkspaceStore((state) => state.environments);
  const globalVariables = useWorkspaceStore(
    (state) => state.globalVariables || []
  );
  const activeEnvironmentId = useWorkspaceStore(
    (state) => state.activeEnvironmentId
  );
  const fakerLocale = useWorkspaceStore((state) => state.fakerLocale);

  const executeRequest = async () => {
    if (!nodeData || !activeRequestId) return;
    setIsLoading(true);

    // Prepare variables for substitution
    const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
    const variables: Record<string, string> = {};

    // 1. Add global variables
    globalVariables.forEach((v) => {
      if (v.enabled) {
        variables[v.key] = v.value;
      }
    });

    // 2. Override with active environment variables
    if (activeEnv) {
      activeEnv.variables.forEach((v) => {
        if (v.enabled) {
          variables[v.key] = v.value;
        }
      });
    }

    let allLogs: string[] = [];

    // 1. Execute Pre-request Script
    let currentVariables = { ...variables };
    if (nodeData.preRequestScript) {
      const result = ScriptExecutor.execute(nodeData.preRequestScript, {
        variables: currentVariables,
        request: nodeData,
        fakerLocale,
      });

      if (result.logs) {
        allLogs.push(...result.logs);
      }

      if (result.error) {
        toast.error(`Pre-request script error: ${result.error}`);
        setIsLoading(false);
        return;
      }

      currentVariables = { ...currentVariables, ...result.variables };
    }

    // Ensure we pass the full data structure including defaults if missing
    const rawRequestData = {
      ...nodeData,
      auth: nodeData.auth || { type: "none" },
      params: nodeData.params || [],
    };

    // Substitute variables
    const requestData = {
      ...rawRequestData,
      url: substituteVariables(
        rawRequestData.url,
        currentVariables,
        fakerLocale
      ),
      headers: rawRequestData.headers.map((h) => ({
        ...h,
        key: substituteVariables(h.key, currentVariables, fakerLocale),
        value: substituteVariables(h.value, currentVariables, fakerLocale),
      })),
      params: rawRequestData.params.map((p) => ({
        ...p,
        key: substituteVariables(p.key, currentVariables, fakerLocale),
        value: substituteVariables(p.value, currentVariables, fakerLocale),
      })),
      body: {
        ...rawRequestData.body,
        content: substituteVariables(
          rawRequestData.body.content,
          currentVariables,
          fakerLocale
        ),
        formData: rawRequestData.body.formData?.map((f) => ({
          ...f,
          key: substituteVariables(f.key, currentVariables, fakerLocale),
          value: substituteVariables(f.value, currentVariables, fakerLocale),
        })),
        formUrlEncoded: rawRequestData.body.formUrlEncoded?.map((f) => ({
          ...f,
          key: substituteVariables(f.key, currentVariables, fakerLocale),
          value: substituteVariables(f.value, currentVariables, fakerLocale),
        })),
      },
      auth: {
        ...rawRequestData.auth,
        basic: rawRequestData.auth.basic
          ? {
              username: substituteVariables(
                rawRequestData.auth.basic.username || "",
                currentVariables,
                fakerLocale
              ),
              password: substituteVariables(
                rawRequestData.auth.basic.password || "",
                currentVariables,
                fakerLocale
              ),
            }
          : undefined,
        bearer: rawRequestData.auth.bearer
          ? {
              token: substituteVariables(
                rawRequestData.auth.bearer.token || "",
                currentVariables,
                fakerLocale
              ),
            }
          : undefined,
        apikey: rawRequestData.auth.apikey
          ? {
              ...rawRequestData.auth.apikey,
              key: substituteVariables(
                rawRequestData.auth.apikey.key || "",
                currentVariables,
                fakerLocale
              ),
              value: substituteVariables(
                rawRequestData.auth.apikey.value || "",
                currentVariables,
                fakerLocale
              ),
            }
          : undefined,
      },
    };

    try {
      const res = await HttpClient.send(requestData);

      // 2. Execute Test Script
      let testResults: any[] = [];
      if (nodeData.testScript) {
        const result = ScriptExecutor.execute(nodeData.testScript, {
          variables: currentVariables,
          request: requestData,
          response: res,
          fakerLocale,
        });

        if (result.logs) {
          allLogs.push(...result.logs);
        }

        testResults = result.testResults;
        if (result.error) {
          toast.error(`Test script error: ${result.error}`);
        }
      }

      setResponse(activeRequestId, { ...res, testResults, logs: allLogs });
      toast.success("Request completed successfully");

      addToHistory({
        requestId: activeRequestId,
        method: requestData.method,
        url: requestData.url,
        timestamp: Date.now(),
        status: res.status,
        statusText: res.statusText,
        duration: res.time,
        size: res.size,
        response: { ...res, testResults, logs: allLogs },
      });
    } catch (error) {
      toast.error("Failed to send request");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    executeRequest,
    variables: useMemo(() => {
      const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
      const vars: Record<string, string> = {};
      globalVariables.forEach((v) => {
        if (v.enabled) vars[v.key] = v.value;
      });
      if (activeEnv) {
        activeEnv.variables.forEach((v) => {
          if (v.enabled) vars[v.key] = v.value;
        });
      }
      return vars;
    }, [environments, activeEnvironmentId, globalVariables]),
    fakerLocale,
  };
}
