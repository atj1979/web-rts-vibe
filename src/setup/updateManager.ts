// Simple update manager for per-frame updates
export type UpdateFn = (deltaTime: number) => void;

type Phase = "normal" | "late";

class UpdateManager {
  private updates = new Set<UpdateFn>();
  private lateUpdates = new Set<UpdateFn>();

  register(fn: UpdateFn, options?: { phase?: Phase }) {
    const target = options?.phase === "late" ? this.lateUpdates : this.updates;
    target.add(fn);
    return () => this.unregister(fn, options); // return unregister function
  }

  registerLate(fn: UpdateFn) {
    return this.register(fn, { phase: "late" });
  }

  unregister(fn: UpdateFn, options?: { phase?: Phase }) {
    if (options?.phase === "late") {
      this.lateUpdates.delete(fn);
    } else {
      if (!this.updates.delete(fn) && options?.phase === undefined) {
        // If phase unknown, make sure we remove from late set too
        this.lateUpdates.delete(fn);
      }
    }
  }

  updateAll({ deltaTime }: { deltaTime: number }) {
    for (const fn of this.updates) {
      fn(deltaTime);
    }
    for (const fn of this.lateUpdates) {
      fn(deltaTime);
    }
  }

  clear() {
    this.updates.clear();
    this.lateUpdates.clear();
  }
}

export const updateManager = new UpdateManager();
