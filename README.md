Minimalistic AI agent created from scratch
---

Minimalistic agent created from scratch to learn about agents harnesses.

This agent is pretty-barebones. It has a single tool that allows it to run shell
commands (with user confirmation).

Running the agent:

```
export OPENAI_API_KEY=...
npm run dev
```

## Extending the Agent

The agent can be extended modifying its prompt in `src/agent.ts` and adding new
tools in `tools/` and binding them to the agent in `index.ts`.
