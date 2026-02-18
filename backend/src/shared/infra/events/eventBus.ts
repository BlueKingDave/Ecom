type Handler<T = unknown> = (payload: T) => Promise<void> | void;

class EventBus {
  private handlers = new Map<string, Handler[]>();

  on<T>(event: string, handler: Handler<T>) {
    const list = this.handlers.get(event) ?? [];
    list.push(handler as Handler);
    this.handlers.set(event, list);
  }

  async emit<T>(event: string, payload: T) {
    await Promise.all((this.handlers.get(event) ?? []).map(h => h(payload)));
  }
}

export const eventBus = new EventBus();
