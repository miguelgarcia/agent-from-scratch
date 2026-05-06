import { HumanMessage, AIMessage, SystemMessage, AnyMessage } from "./messages";
import { ChatModel } from "./llm-providers/openai"
import { GenericTool } from "./tool";

type AgentOutput = AnyMessage;

class Agent {
  messageHistory: Array<AnyMessage>
  chatModel: ChatModel
  prompt: Array<SystemMessage>
  tools: Array<GenericTool>

  constructor(params: { tools: Array<GenericTool> }) {
    this.messageHistory = [];
    this.tools = [...params.tools];
    this.chatModel = new ChatModel();
    this.chatModel.bindTools(this.tools);
    this.prompt = [new SystemMessage("You are an expert in software development.")];
  }

  /**
   * Adds a message to the history and runs the agent producing messages.
   * @param msg
   */
  async* invoke(msg: HumanMessage): AsyncGenerator<AgentOutput, any, any> {
    this.messageHistory.push(msg);
    const modelInput = [...this.prompt, ...this.messageHistory];
    const response: AIMessage = await this.chatModel.invoke(modelInput);
    this.messageHistory.push(response);
    yield response;
  }
}

export { Agent };
