import * as THREE from 'three';

export interface ThreeSceneOptions {
  width: number;
  height: number;
  background?: number;
}

export interface ThreeSceneBundle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export const createThreeScene = (options: ThreeSceneOptions): ThreeSceneBundle => {
  const scene = new THREE.Scene();
  if (options.background !== undefined) {
    scene.background = new THREE.Color(options.background);
  }

  const camera = new THREE.PerspectiveCamera(50, options.width / options.height, 0.1, 1000);
  camera.position.set(0, 0, 5);

  return { scene, camera };
};
