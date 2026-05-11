/**
 * Type definitions for the different kinds of messages.
 */

type MessageType = "ai" | "human" | "system" | "tool";

abstract class BaseMessage<TMsgType extends MessageType> {
  content: string | null = "";
  abstract readonly type: TMsgType;

  constructor(content?: string) {
    this.content = typeof content == "string" ? content : null;
  }
}

class HumanMessage extends BaseMessage<"human"> {
  content: string;
  readonly type = "human" as const;

  constructor(content: string) {
    super();
    this.content = content;
  }
}

class ToolCall {
  id: string = "";
  toolName: string = "";
  arguments: Object | null = {};

  constructor(params: { id: string, toolName: string, arguments: Object | null }) {
    this.id = params.id;
    this.toolName = params.toolName;
    this.arguments = params.arguments;
  }
};

class AIMessage extends BaseMessage<"ai"> {
  toolCalls: ToolCall[] | null = null;
  readonly type = "ai" as const;

  constructor(params: { content: string | null, toolCalls?: Array<ToolCall> | undefined }) {
    super();
    this.content = params.content;
    this.toolCalls = params.toolCalls || null;
  }
}

class SystemMessage extends BaseMessage<"system"> {
  content: string;
  readonly type = "system" as const;

  constructor(content: string) {
    super();
    this.content = content;
  }
}

class ToolMessage extends BaseMessage<"tool"> {
  readonly type = "tool" as const;
  content: string;
  toolCallId: string;

  constructor(content: string, toolCallId: string) {
    super();
    this.content = content;
    this.toolCallId = toolCallId;
  }
}

export type AnyMessage = HumanMessage | AIMessage | SystemMessage | ToolMessage;
export { HumanMessage, AIMessage, SystemMessage, ToolCall, ToolMessage };
