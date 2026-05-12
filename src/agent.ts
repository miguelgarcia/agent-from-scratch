import { HumanMessage, AIMessage, SystemMessage, AnyMessage, ToolMessage } from "./messages";
import { ChatModel } from "./llm-providers/openai"
import { AnyTool } from "./tool";
import { Interrupt } from "./interrupt";

type AgentOutput = AnyMessage | Interrupt;

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
    this.prompt = [new SystemMessage(
      "You are a software engineering assistant. Help users with coding tasks: writing, debugging, refactoring, and understanding code.\n" +
      "You have one tool: a shell. Use it to explore the codebase, run tests, edit files, and execute commands.\n" +
      "Be direct and efficient. Prefer small, targeted commands. Always verify your changes work."
    )];
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
          const interrupt = new Interrupt(`Allow tool ${tool.name} with args: ${JSON.stringify(args)}`);
          yield interrupt;
          const answer = await interrupt.await();
          let toolMsg: ToolMessage;
          if (answer == "y") {
            const toolResult = await tool.invoke(args);
            toolMsg = new ToolMessage(JSON.stringify(toolResult), toolCall.id);
          } else {
            toolMsg = new ToolMessage("blocked by user", toolCall.id);
          }
          yield toolMsg;
          this.messageHistory.push(toolMsg);
        } catch (e) {
          throw new Error(`Error calling tool ${tool.name} ${e}`);
        }
      }
    }
  }

  async awaitInterrupt(interruptId: string) {

  }
}

export { Agent };
