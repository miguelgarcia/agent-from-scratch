/**
 * Type definitions for the different kinds of messages.
 */

import { NullLiteral } from "typescript";

type MessageType = "ai" | "human" | "system";

abstract class BaseMessage<TMsgType extends MessageType> {
  content: string | null= "";
  abstract readonly type: TMsgType;
}

class HumanMessage extends BaseMessage<"human">{
  content: string = ""
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
  content: string | null = null;
  toolCalls: Array<ToolCall> | null = null;
  readonly type = "ai" as const;

  constructor(params: { content: string | null, toolCalls?: Array<ToolCall> | undefined }) {
    super();
    this.content = params.content;
    this.toolCalls = params.toolCalls || null;
  }
}

class SystemMessage extends BaseMessage<"system"> {
  content: string = ""
  readonly type = "system" as const;

  constructor(content: string) {
    super();
    this.content = content;
  }
}

export type AnyMessage = HumanMessage | AIMessage | SystemMessage;
export { HumanMessage, AIMessage, SystemMessage, ToolCall };
