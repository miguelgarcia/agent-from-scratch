import OpenAI from 'openai';
import { AIMessage, AnyMessage } from '../messages';

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

class ChatModel {
  client: OpenAI;
  model: string;

  constructor() {
    this.client = new OpenAI();
    this.model = "gpt-4o-mini";
  }

  async invoke(messages: Array<AnyMessage>): Promise<AIMessage> {
    const response: OpenAI.Chat.ChatCompletion = await this.client.chat.completions.create({
      model: this.model,
      messages: formatMessages(messages)
    });
    const choice = response.choices[0];
    if (!choice || !choice.message?.content) {
      throw new Error("No response from model");
    }
    const reply = choice.message?.content;
    return new AIMessage(reply);
  }
}

export { ChatModel };
