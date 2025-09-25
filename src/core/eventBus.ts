type EventHandler<T = any> = (payload: T) => void;

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on<T = any>(event: string, handler: EventHandler<T>) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler as EventHandler);
  }

  off<T = any>(event: string, handler: EventHandler<T>) {
    this.listeners.get(event)?.delete(handler as EventHandler);
  }

  emit<T = any>(event: string, payload?: T) {
    for (const handler of this.listeners.get(event) || []) {
      handler(payload!);
    }
  }

  clear(event?: string) {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
  }
}

export const eventBus = new EventBus();
