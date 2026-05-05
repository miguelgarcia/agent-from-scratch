import { HumanMessage, AIMessage, SystemMessage, AnyMessage } from "./messages";
import { ChatModel } from "./llm-providers/openai"

type AgentOutput = AnyMessage;

class Agent {
  messageHistory: Array<AnyMessage>
  chatModel: ChatModel
  prompt: Array<SystemMessage>

  constructor() {
    this.messageHistory = [];
    this.chatModel = new ChatModel();
    this.prompt = [new SystemMessage("You are an expert in software development.")];
  }

  async* invoke(msg: HumanMessage): AsyncGenerator<AgentOutput, any, any> {
    this.messageHistory.push(msg);
    const modelInput = [...this.prompt, ...this.messageHistory];
    const response: AIMessage = await this.chatModel.invoke(modelInput);
    this.messageHistory.push(response);
    yield response;
  }
}

export { Agent };
