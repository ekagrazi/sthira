"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/client";

type ResourceState<T> =
  | { status: "loading" }
  | { data: T; status: "success" }
  | { error: ApiClientError; status: "error" };

export function useApiResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
): ResourceState<T> & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ResourceState<T>>({ status: "loading" });
  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ data, status: "success" });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          error:
            error instanceof ApiClientError
              ? error
              : new ApiClientError("This section could not be loaded.", "generic"),
          status: "error",
        });
      },
    );
    return () => controller.abort();
  }, [attempt, load]);

  return { ...state, retry };
}
