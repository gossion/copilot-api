import { expect, mock, test } from "bun:test"

import { state } from "../src/lib/state"
import {
  createResponses,
  type ResponsesPayload,
} from "../src/services/copilot/create-responses"

state.copilotToken = "test-token"
state.vsCodeVersion = "1.0.0"
state.accountType = "individual"

const fetchMock = mock(
  (_url: string, _opts: { headers: Record<string, string> }) => {
    return new Response(
      JSON.stringify({ id: "resp_123", object: "response" }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    )
  },
)

// @ts-expect-error - Mock fetch doesn't implement all fetch properties
;(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock

test("proxies responses requests to the upstream responses endpoint", async () => {
  fetchMock.mockClear()

  const payload: ResponsesPayload = {
    model: "gpt-test",
    input: "hi",
  }

  const response = await createResponses(payload)

  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock.mock.calls[0]?.[0]).toBe(
    "https://api.githubcopilot.com/responses",
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ id: "resp_123", object: "response" })

  const headers = (
    fetchMock.mock.calls[0]?.[1] as { headers: Record<string, string> }
  ).headers
  expect(headers["X-Initiator"]).toBe("user")
})

test("marks responses requests with tool outputs as agent-initiated", async () => {
  fetchMock.mockClear()

  const payload: ResponsesPayload = {
    model: "gpt-test",
    input: [
      {
        type: "function_call_output",
        call_id: "call_123",
        output: "ok",
      },
    ],
  }

  await createResponses(payload)

  const headers = (
    fetchMock.mock.calls[0]?.[1] as { headers: Record<string, string> }
  ).headers
  expect(headers["X-Initiator"]).toBe("agent")
})
