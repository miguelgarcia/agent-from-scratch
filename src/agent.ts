import { HumanMessage, AIMessage, SystemMessage, AnyMessage, ToolMessage } from "./messages";
import { ChatModel } from "./llm-providers/openai"
import { AnyTool } from "./tool";

type AgentOutput = AnyMessage;

class Agent {
  messageHistory: Array<AnyMessage>
  chatModel: ChatModel
  prompt: Array<SystemMessage>
  tools: Array<AnyTool>
  #toolsByName: Map<string, AnyTool>

  constructor(params: { tools: Array<AnyTool> }) {
    this.messageHistory = [];
    this.tools = [...params.tools];
    this.#toolsByName = new Map();
    this.tools.forEach(t => this.#toolsByName.set(t.name, t));
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
    let recursionLimit = 25;
    while (recursionLimit-- > 0) {
      const modelInput = [...this.prompt, ...this.messageHistory];
      const response: AIMessage = await this.chatModel.invoke(modelInput);
      this.messageHistory.push(response);
      yield response;

      if (!response.toolCalls || response.toolCalls.length == 0) {
        // Nothing else to do
        break;
      }
      // For now we do sequential tool calling
      for (const toolCall of response.toolCalls) {
        const args = toolCall.arguments;
        const tool = this.#toolsByName.get(toolCall.toolName);
        if (!tool) {
          throw new Error(`Tool not found ${toolCall.toolName}`);
        }
        try {
          const toolResult = await tool.invoke(args);
          const toolMsg = new ToolMessage(JSON.stringify(toolResult), toolCall.id);
          yield toolMsg;
          this.messageHistory.push(toolMsg);
        } catch (e) {
          throw new Error(`Error calling tool ${tool.name} ${e}`);
        }
      }
    }
  }
}

export { Agent };
