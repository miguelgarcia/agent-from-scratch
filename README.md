# agent-from-scratch

> A minimalistic AI agent harness, built from scratch — to learn how they actually work.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)
![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey)

No frameworks. No magic. Just an agent loop, a tool interface, and the wires you need to see them work.

## Features

- **Streaming agent loop** with tool calling, written as an async generator
- **Built-in shell tool** with per-call user confirmation (y/n)
- **Interruptible** — pause and approve every tool invocation
- **Pluggable** architecture for tools and LLM providers
- **Tiny surface area** — TypeScript, no agent framework, easy to read and understand end-to-end

## Quick Start

```bash
export OPENAI_API_KEY=...
npm install
npm run dev
```

## Extending the Agent

- **Add a tool** — drop it in `src/tools/` and bind it in `src/index.ts`
- **Add a provider** — implement one in `src/llm-providers/` alongside `openai.ts`
- **Tweak behavior** — edit the system prompt in `src/agent.ts`

## Project Layout

```
src/
├─ agent.ts           # the agent loop
├─ tool.ts            # tool interface
├─ interrupt.ts       # human-in-the-loop approvals
├─ messages.ts        # message types
├─ tools/
│  └─ shell.ts        # shell command tool
└─ llm-providers/
   └─ openai.ts       # OpenAI chat model
```

## License

MIT © Miguel Garcia
