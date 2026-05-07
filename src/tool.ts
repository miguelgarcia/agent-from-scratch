import { z } from "zod";

export class ToolDefinition<TSchema extends z.ZodType> {
  name: string;
  description: string;
  schema: TSchema;

  constructor(params: {
    name: string;
    description: string;
    schema: TSchema;
  }) {
    this.name = params.name;
    this.description = params.description;
    this.schema = params.schema;
  }
}

export type AnyToolDefinition = ToolDefinition<z.ZodType>;

export class FunctionTool<TSchema extends z.ZodType> extends ToolDefinition<TSchema> {
  callable: (args: z.infer<TSchema>) => Promise<any> | any;

  constructor(params: {
    name: string;
    description: string;
    schema: TSchema;
    callable: (args: z.infer<TSchema>) => Promise<any> | any;
  }) {
    super({ name: params.name, description: params.description, schema: params.schema });
    this.callable = params.callable;
  }

  async invoke(args: unknown) {
    const parsed = this.schema.parse(args); // runtime validation
    return await this.callable(parsed);     // fully typed here
  }
}

export type AnyFunctionTool = FunctionTool<z.ZodType>;
export type AnyTool = AnyFunctionTool;
