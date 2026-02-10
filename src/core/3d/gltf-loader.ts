import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const cache = new Map<string, THREE.Group>();

export const loadGLTF = async (path: string): Promise<THREE.Group> => {
  if (cache.has(path)) {
    return cache.get(path) as THREE.Group;
  }

  const loader = new GLTFLoader();

  const scene = await new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      path,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error)
    );
  });

  cache.set(path, scene);
  return scene;
};
