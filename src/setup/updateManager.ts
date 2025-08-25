// Simple update manager for per-frame updates
export type UpdateFn = (deltaTime: number) => void;

class UpdateManager {
  private updates = new Set<UpdateFn>();

  register(fn: UpdateFn) {
    this.updates.add(fn);
    return () => this.unregister(fn); // return unregister function
  }

  unregister(fn: UpdateFn) {
    this.updates.delete(fn);
  }

  updateAll({deltaTime}: {deltaTime: number}) {
    for (const fn of this.updates) {
      fn(deltaTime);
    }
  }

  clear() {
    this.updates.clear();
  }
}

export const updateManager = new UpdateManager();
