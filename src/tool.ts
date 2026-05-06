import { z } from "zod";

export class Tool<TSchema extends z.ZodType> {
  name: string;
  description: string;
  schema: TSchema;
  callable: (args: z.infer<TSchema>) => Promise<any> | any;

  constructor(params: {
    name: string;
    description: string;
    schema: TSchema;
    callable: (args: z.infer<TSchema>) => Promise<any> | any;
  }) {
    this.name = params.name;
    this.description = params.description;
    this.schema = params.schema;
    this.callable = params.callable;
  }

  async invoke(args: unknown) {
    const parsed = this.schema.parse(args); // runtime validation
    return await this.callable(parsed);     // fully typed here
  }
}

export type GenericTool = Tool<z.ZodType>;
