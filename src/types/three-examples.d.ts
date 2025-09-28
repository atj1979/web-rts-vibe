declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import * as THREE from 'three';
  export class GLTFLoader {
    constructor();
    load(url: string, onLoad: (gltf: any) => void, onProgress?: (event: ProgressEvent) => void, onError?: (err: Error | unknown) => void): void;
  }
}
