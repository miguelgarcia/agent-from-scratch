/**
 * Type definitions for the different kinds of messages.
 */

type MessageType = "ai" | "human" | "system";

abstract class BaseMessage<TMsgType extends MessageType> {
  content: string = "";
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

class AIMessage extends BaseMessage<"ai"> {
  content: string = ""
  readonly type = "ai" as const;

  constructor(content: string) {
    super();
    this.content = content;
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
export { HumanMessage, AIMessage, SystemMessage }
