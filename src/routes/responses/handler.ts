import type { Context } from "hono"

import { awaitApproval } from "~/lib/approval"
import { checkRateLimit } from "~/lib/rate-limit"
import { state } from "~/lib/state"
import {
  createResponses,
  type ResponsesPayload,
} from "~/services/copilot/create-responses"

export async function handleResponses(c: Context) {
  await checkRateLimit(state)

  const payload = await c.req.json<ResponsesPayload>()

  if (state.manualApprove) await awaitApproval()

  const response = await createResponses(payload)
  return new Response(response.body, {
    status: response.status,
    headers: new Headers(response.headers),
  })
}
