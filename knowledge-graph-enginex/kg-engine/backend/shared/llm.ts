// Thin wrapper around the managed OpenAI resource for JSON-constrained generation.
// Pass 1 and pass 2 of extraction use different models + temperatures so the
// agreement score measures true independent extraction.

export const PASS1_MODEL = 'gpt-4.1-mini'
export const PASS2_MODEL = 'gpt-4o-mini'
export const JUDGE_MODEL = 'gpt-4.1-mini'

function stripFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced && fenced[1]) return fenced[1].trim()
  return text.trim()
}

function extractJson(text: string): unknown | null {
  const cleaned = stripFences(text)
  try {
    return JSON.parse(cleaned)
  } catch {
    // fallback: grab the outermost JSON object or array
    const start = cleaned.search(/[[{]/)
    if (start === -1) return null
    for (let end = cleaned.length; end > start; end--) {
      const slice = cleaned.slice(start, end)
      try {
        return JSON.parse(slice)
      } catch {
        continue
      }
    }
    return null
  }
}

export async function llmText(args: {
  instruction: string
  systemMessage?: string
  model?: string
  temperature?: number
}): Promise<string> {
  const res = await openai.text.generate({
    instruction: args.instruction,
    model: (args.model || JUDGE_MODEL) as 'gpt-4.1-mini',
    temperature: args.temperature ?? 0.2,
    ...(args.systemMessage ? { systemMessage: args.systemMessage } : {}),
  })
  return res.data.queryData.data
}

/** Run an LLM call and parse the response as JSON. Returns null when unparseable. */
export async function llmJson<T>(args: {
  instruction: string
  systemMessage?: string
  model?: string
  temperature?: number
}): Promise<T | null> {
  const text = await llmText(args)
  const parsed = extractJson(text)
  return parsed as T | null
}

export function modelProvenance(model: string): { stage: string; model: string } {
  return { stage: 'llm', model }
}
