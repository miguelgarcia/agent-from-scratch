export class Interrupt {
  content: string
  #promise: Promise<string>;
  #resolve
  readonly type = "interrupt" as const;

  constructor(content: string) {
    this.content = content;
    const { promise, resolve } = Promise.withResolvers<string>();
    this.#promise = promise;
    this.#resolve = resolve;
  }

  answer(answer: string) {
    this.#resolve(answer);
  }

  async await() {
    return await this.#promise;
  }
}
