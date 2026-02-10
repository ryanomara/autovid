import { describe, it, expect } from '../setup.js';
import {
  transitionFade,
  transitionSlide,
  transitionZoom,
  transitionDissolve,
  transitionWipe,
  transitionIris,
  transitionClockWipe,
  transitionBlinds,
  transitionFlip,
  transitionMorph,
  transitionGlitch,
  transitionPixelate,
  transitionRadialWipe,
  transitionDoorway,
  transitionCube,
} from '../../src/core/animation/transitions.js';
import { createBuffer, fillBuffer } from '../../src/core/engine/canvas.js';

const makeBuffers = () => {
  const from = createBuffer(4, 4);
  const to = createBuffer(4, 4);
  fillBuffer(from, { r: 255, g: 0, b: 0, a: 1 });
  fillBuffer(to, { r: 0, g: 255, b: 0, a: 1 });
  return { from, to };
};

describe('Transitions', () => {
  it('fade transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionFade(from, to, 0.5);
    expect(result.width).toBe(4);
  });

  it('slide transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionSlide(from, to, 0.5, 'left');
    expect(result.width).toBe(4);
  });

  it('zoom transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionZoom(from, to, 0.5, 'in');
    expect(result.width).toBe(4);
  });

  it('dissolve transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionDissolve(from, to, 0.5);
    expect(result.width).toBe(4);
  });

  it('wipe transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionWipe(from, to, 0.5, 'left');
    expect(result.width).toBe(4);
  });

  it('iris transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionIris(from, to, 0.5);
    expect(result.width).toBe(4);
  });

  it('clock wipe transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionClockWipe(from, to, 0.5);
    expect(result.width).toBe(4);
  });

  it('blinds transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionBlinds(from, to, 0.5, 'left');
    expect(result.width).toBe(4);
  });

  it('flip transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionFlip(from, to, 0.5);
    expect(result.width).toBe(4);
  });

  it('morph transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionMorph(from, to, 0.5);
    expect(result.width).toBe(4);
  });

  it('glitch transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionGlitch(from, to, 0.5);
    expect(result.width).toBe(4);
  });

  it('pixelate transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionPixelate(from, to, 0.5);
    expect(result.width).toBe(4);
  });

  it('radial wipe transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionRadialWipe(from, to, 0.5);
    expect(result.width).toBe(4);
  });

  it('doorway transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionDoorway(from, to, 0.5);
    expect(result.width).toBe(4);
  });

  it('cube transition returns buffer', () => {
    const { from, to } = makeBuffers();
    const result = transitionCube(from, to, 0.5);
    expect(result.width).toBe(4);
  });
});
