/* The artboard size every screen is built at. The stress run changes it. */

export let FRAME_W = 1440;
export let FRAME_H = 1024;

export const setFrameSize = function (width: number, height: number): void {
  FRAME_W = width;
  FRAME_H = height;
};
