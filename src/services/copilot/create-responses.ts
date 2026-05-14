import consola from "consola"

import { copilotBaseUrl, copilotHeaders } from "~/lib/api-config"
import { HTTPError } from "~/lib/error"
import { state } from "~/lib/state"

export const createResponses = async (payload: ResponsesPayload) => {
  if (!state.copilotToken) throw new Error("Copilot token not found")

  const headers: Record<string, string> = {
    ...copilotHeaders(state, hasVisionInput(payload.input)),
    "X-Initiator": isAgentCall(payload.input) ? "agent" : "user",
  }

  const response = await fetch(`${copilotBaseUrl(state)}/responses`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    consola.error("Failed to create response", response)
    throw new HTTPError("Failed to create response", response)
  }

  return response
}

export interface ResponsesPayload {
  model: string
  input?: string | Array<ResponsesInputItem> | null
  stream?: boolean | null
  tools?: Array<ResponsesTool> | null
  tool_choice?: string | Record<string, unknown> | null
  [key: string]: unknown
}

export interface ResponsesInputItem {
  role?: string
  type?: string
  content?: string | Array<ResponsesContentPart> | null
  [key: string]: unknown
}

export interface ResponsesContentPart {
  type?: string
  [key: string]: unknown
}

export interface ResponsesTool {
  type?: string
  [key: string]: unknown
}

const isAgentCall = (input: ResponsesPayload["input"]) => {
  if (!Array.isArray(input)) return false

  return input.some((item) => {
    if (item.role && ["assistant", "tool"].includes(item.role)) {
      return true
    }

    if (
      item.type
      && [
        "computer_call",
        "computer_call_output",
        "custom_tool_call",
        "custom_tool_call_output",
        "function_call",
        "function_call_output",
        "reasoning",
      ].includes(item.type)
    ) {
      return true
    }

    return false
  })
}

const hasVisionInput = (input: ResponsesPayload["input"]) => {
  if (!Array.isArray(input)) return false

  return input.some((item) => {
    if (item.type === "input_image") return true

    return (
      Array.isArray(item.content)
      && item.content.some((contentPart) =>
        ["image_url", "input_image"].includes(contentPart.type ?? ""),
      )
    )
  })
}
