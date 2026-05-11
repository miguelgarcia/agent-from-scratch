import { HumanMessage, AIMessage, SystemMessage, AnyMessage, ToolMessage, ToolCall } from "./messages";
import { ChatModel } from "./llm-providers/openai"
import { AnyTool } from "./tool";
import { Interrupt } from "./interrupt";

export type AgentOutput = AnyMessage | Interrupt;

type AgentPhase = "beforeTools" | "beforeModel";

export type AgentRunContext = {
  prompt: SystemMessage[];
  messages: AnyMessage[];
  toolCalls: ToolCall[] | null;
}

export type Middleware = (
  ctx: AgentRunContext,
  next: () => AsyncGenerator<AgentOutput, void, void>,
) => AsyncGenerator<AgentOutput, void, void>;

class Agent {
  messageHistory: Array<AnyMessage>
  chatModel: ChatModel
  prompt: Array<SystemMessage>
  tools: Array<AnyTool>
  #toolsByName: Map<string, AnyTool>

  private middlewares = new Map<AgentPhase, Middleware[]>();

  use(phase: AgentPhase, middleware: Middleware) {
    const arr = this.middlewares.get(phase) ?? [];

    arr.push(middleware);

    this.middlewares.set(phase, arr);
  }

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
    const ctx: AgentRunContext = {
      prompt: [new SystemMessage("You are an expert in software development.")],
      messages: this.messageHistory,
      toolCalls: null
    };
    this.messageHistory.push(msg);
    let recursionLimit = 25;
    while (recursionLimit-- > 0) {
      yield* this.runPhase("beforeModel", ctx);
      const modelInput = [...ctx.prompt, ...ctx.messages];
      const response: AIMessage = await this.chatModel.invoke(modelInput);
      this.messageHistory.push(response);
      yield response;

      if (!response.toolCalls || response.toolCalls.length == 0) {
        // Nothing else to do
        break;
      }
      // For now we do sequential tool calling
      ctx.toolCalls = response.toolCalls;
      yield* this.runPhase("beforeTools", ctx);
      for (const toolCall of ctx.toolCalls ?? []) {
        const tool = this.#toolsByName.get(toolCall.toolName);
        if (!tool) {
          throw new Error(`Tool not found ${toolCall.toolName}`);
        }
        try {
          const toolResult = await tool.invoke(toolCall.arguments);
          const toolMsg = new ToolMessage(JSON.stringify(toolResult), toolCall.id);
          yield toolMsg;
          this.messageHistory.push(toolMsg);
        } catch (e) {
          throw new Error(`Error calling tool ${tool.name} ${e}`);
        }
      }
    }
  }

  private async *runPhase(
    phase: AgentPhase,
    ctx: AgentRunContext,
  ): AsyncGenerator<AgentOutput, void, void> {
    const middlewares = this.middlewares.get(phase) ?? [];

    const dispatch = async function* (index: number): AsyncGenerator<AgentOutput, void, void> {
      const mw = middlewares[index];
      if (!mw) return;
      yield* mw(ctx, () => dispatch(index + 1));
    };

    yield* dispatch(0);
  }
}

export { Agent };
