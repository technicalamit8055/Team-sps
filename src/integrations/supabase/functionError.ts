import { FunctionsHttpError } from '@supabase/supabase-js';

// supabase-js's FunctionsHttpError.message is always the hardcoded string
// "Edge Function returned a non-2xx status code" — it never reads the
// response body. The real reason (e.g. "Username already exists",
// "Unauthorized: Admin or Manager role required") is JSON in the response
// that only `error.context` (the raw Response object) gives access to.
export async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) return body.error;
    } catch {
      // Response body wasn't JSON — fall through to the generic message.
    }
  }
  return error instanceof Error ? error.message : String(error);
}
