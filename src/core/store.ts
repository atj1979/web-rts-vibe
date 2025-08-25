// Simple global store for app state
export type AppState = {
  currentSceneIdx: number;
  menuVisible: boolean;
  userSpawn: { x: number; y: number; z: number };
  // Add more as needed
};

const defaultState: AppState = {
  currentSceneIdx: 0,
  menuVisible: false,
  userSpawn: { x: 0, y: 1, z: 0 },
};

let state: AppState = { ...defaultState };

export const store = {
  get(): AppState {
    return state;
  },
  set(partial: Partial<AppState>) {
    state = { ...state, ...partial };
  },
  reset() {
    state = { ...defaultState };
  },
};
