/**
 * Mini wrapper for OpenAI
 */
import OpenAI from 'openai';
import { AIMessage, AnyMessage } from '../messages';
import { GenericTool } from '../tool';
import { ChatCompletionFunctionTool } from 'openai/resources';

const formatMessage = (msg: AnyMessage): OpenAI.Chat.Completions.ChatCompletionMessageParam => {
  switch (msg.type) {
    case "human":
      return { role: "user", content: msg.content };
    case "ai":
      return { role: "assistant", content: msg.content };
    case "system":
      return { role: "system", content: msg.content };
  }
}

const formatMessages = (messages: Array<AnyMessage>) => messages.map(formatMessage);

const formatTool = (tool: GenericTool): ChatCompletionFunctionTool => {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.schema.toJSONSchema(),
    }
  }
}

const formatTools = (tools: Array<GenericTool>) => tools.map(formatTool);

class ChatModel {
  client: OpenAI;
  model: string;
  tools: Array<GenericTool>;
  #openAITools: Array<any>;

  constructor() {
    this.client = new OpenAI();
    this.model = "gpt-4o-mini";
    this.tools = [];
    this.#openAITools = [];
  }

  bindTools(tools: Array<GenericTool>) {
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
    console.log(JSON.stringify(choice, null, 2));
    if (!choice || !choice.message?.content) {
      throw new Error("No response from model");
    }
    const reply = choice.message?.content;
    return new AIMessage(reply);
  }
}

export { ChatModel };
