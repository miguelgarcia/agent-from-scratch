/**
 * Mini wrapper for OpenAI
 */
import OpenAI from 'openai';
import { AIMessage, AnyMessage, ToolCall } from '../messages';
import { AnyToolDefinition } from '../tool';
import { ChatCompletionFunctionTool } from 'openai/resources';
import { ChatCompletionMessageToolCall } from 'openai/resources';

const formatMessage = (msg: AnyMessage): OpenAI.Chat.Completions.ChatCompletionMessageParam => {
  switch (msg.type) {
    case "human":
      return { role: "user", content: msg.content };
    case "ai":
      return {
        role: "assistant",
        content: msg.content || "",
        tool_calls: (msg.toolCalls && msg.toolCalls.length > 0)
          ? (msg.toolCalls.map(tc => ({
            id: tc.id,
            type: "function",
            function: {
              arguments: JSON.stringify(tc.arguments),
              name: tc.toolName
            }
          })))
          : []
      };
    case "system":
      return { role: "system", content: msg.content };
    case "tool":
      return { role: "tool", content: msg.content, tool_call_id: msg.toolCallId };
  }
}

const formatMessages = (messages: Array<AnyMessage>) => messages.map(formatMessage);

const formatTool = (tool: AnyToolDefinition): ChatCompletionFunctionTool => {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.schema.toJSONSchema(),
    }
  }
}

const formatTools = (tools: Array<AnyToolDefinition>) => tools.map(formatTool);

const parseToolCall = (toolCall: ChatCompletionMessageToolCall) => {
  if (toolCall.type != "function") {
    throw new Error(`Unsupported tool call type ${toolCall.type}`);
  }
  return new ToolCall({
    id: toolCall.id,
    toolName: toolCall.function.name,
    arguments: toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : null
  });
}

const parseToolCalls = (toolCalls: Array<ChatCompletionMessageToolCall> | undefined): Array<ToolCall> | undefined => {
  if (!toolCalls) {
    return;
  }
  return toolCalls.map(parseToolCall);
}

class ChatModel {
  client: OpenAI;
  model: string;
  tools: Array<AnyToolDefinition>;
  #openAITools: Array<any>;

  constructor() {
    this.client = new OpenAI();
    this.model = "gpt-4o-mini";
    this.tools = [];
    this.#openAITools = [];
  }

  bindTools(tools: Array<AnyToolDefinition>) {
    this.tools = [...tools];
    this.#openAITools = formatTools(this.tools);
  }

  async invoke(messages: Array<AnyMessage>): Promise<AIMessage> {
    const response: OpenAI.Chat.ChatCompletion = await this.client.chat.completions.create({
      model: this.model,
      messages: formatMessages(messages),
      tools: this.#openAITools,
      temperature: 0,
      parallel_tool_calls: true
    });
    const choice = response.choices[0];
    if (!choice || (!choice.message?.content && !((choice.message.tool_calls || []).length > 0))) {
      throw new Error("No response from model");
    }
    const content = choice.message?.content;
    const toolCalls = parseToolCalls(choice.message?.tool_calls);
    return new AIMessage({ content, toolCalls });
  }
}

export { ChatModel };
