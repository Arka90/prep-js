export type AIProvider = "openai" | "anthropic";

const OPENAI_MODEL = "gpt-4-turbo-preview";
const ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022";

interface AICallOptions {
  provider: AIProvider;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

/**
 * Unified AI call function.
 * Abstracts OpenAI and Anthropic behind a single interface.
 * Returns the raw text content from the model.
 */
export async function callAI(
  userMessage: string,
  options: AICallOptions,
): Promise<string> {
  const {
    provider,
    systemMessage,
    temperature = 0.7,
    maxTokens = 1024,
    jsonMode = false,
  } = options;

  if (provider === "anthropic") {
    return callAnthropic(userMessage, {
      systemMessage,
      temperature,
      maxTokens,
      jsonMode,
    });
  }

  return callOpenAI(userMessage, {
    systemMessage,
    temperature,
    maxTokens,
    jsonMode,
  });
}

async function callOpenAI(
  userMessage: string,
  options: Omit<AICallOptions, "provider">,
): Promise<string> {
  const { systemMessage, temperature, maxTokens, jsonMode } = options;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key missing");

  const messages: { role: string; content: string }[] = [];
  if (systemMessage) messages.push({ role: "system", content: systemMessage });
  messages.push({ role: "user", content: userMessage });

  const body: Record<string, unknown> = {
    model: OPENAI_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) body.response_format = { type: "json_object" };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}

async function callAnthropic(
  userMessage: string,
  options: Omit<AICallOptions, "provider">,
): Promise<string> {
  const { systemMessage, temperature, maxTokens, jsonMode } = options;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key missing");

  const messages: { role: string; content: string }[] = [
    { role: "user", content: userMessage },
  ];

  // Prefill the assistant response with '{' to steer JSON output
  if (jsonMode) {
    messages.push({ role: "assistant", content: "{" });
  }

  const body: Record<string, unknown> = {
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    temperature,
    messages,
  };

  if (systemMessage) body.system = systemMessage;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.content[0].text as string;

  // Re-attach the prefill character so the result is valid JSON
  return jsonMode ? "{" + text : text;
}
