
type SyncResult = {
  success: boolean;
  skipped?: boolean;
  synced?: number;
  deleted?: number;
  error?: string;
};

let queue: Promise<unknown> = Promise.resolve();

export function syncGoogleCalendar(): Promise<SyncResult> {
  const operation = queue.then(async () => {
    const response = await fetch(
      "/api/integrations/google/sync",
      {
        method: "POST",
        cache: "no-store",
      }
    );

    const data = (await response.json()) as SyncResult;

    if (!response.ok) {
      throw new Error(
        data.error ?? "Erro na sincronização."
      );
    }

    return data;
  });

  queue = operation.catch(() => undefined);

  return operation;
}

export async function syncGoogleCalendarSafely() {
  try {
    const result = await syncGoogleCalendar();

    if (!result.skipped) {
      window.dispatchEvent(
        new Event("google-calendar-synced")
      );
    }

    return true;
  } catch {
    window.dispatchEvent(
      new Event("google-calendar-sync-error")
    );

    return false;
  }
}
