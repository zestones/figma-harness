'use strict';

import type { MockNode } from './figma-mock/types.ts';

interface FlowMetrics {
  crossMax: number;
  flow: MockNode[];
  gaps: number;
  horizontal: boolean;
  mainSum: number;
  paddingCrossEnd: number;
  paddingCrossStart: number;
  paddingMainEnd: number;
  paddingMainStart: number;
}

function flowMetrics(node: MockNode): FlowMetrics {
  const horizontal = node.layoutMode === 'HORIZONTAL';
  const flow = node.children.filter((child) => child.layoutPositioning !== 'ABSOLUTE');
  const paddingMainStart = horizontal ? node.paddingLeft : node.paddingTop;
  const paddingMainEnd = horizontal ? node.paddingRight : node.paddingBottom;
  const paddingCrossStart = horizontal ? node.paddingTop : node.paddingLeft;
  const paddingCrossEnd = horizontal ? node.paddingBottom : node.paddingRight;
  const gaps = Math.max(0, flow.length - 1) * node.itemSpacing;
  let mainSum = 0;
  let crossMax = 0;
  for (const child of flow) {
    mainSum += horizontal ? child.width : child.height;
    crossMax = Math.max(crossMax, horizontal ? child.height : child.width);
  }
  return {
    crossMax,
    flow,
    gaps,
    horizontal,
    mainSum,
    paddingCrossEnd,
    paddingCrossStart,
    paddingMainEnd,
    paddingMainStart,
  };
}

/* The height of a wrapping row: its lines, broken where solveLayout breaks them. */
function wrappedHeight(node: MockNode, metrics: FlowMetrics): number {
  const available = node.width - metrics.paddingMainStart - metrics.paddingMainEnd;
  let x = 0;
  let total = 0;
  let line = 0;
  for (const child of metrics.flow) {
    if (x > 0 && x + child.width > available) {
      total += line + (node.counterAxisSpacing || 0);
      x = 0;
      line = 0;
    }
    x += child.width + node.itemSpacing;
    line = Math.max(line, child.height);
  }
  return total + line;
}

function applyHugSize(node: MockNode, metrics: FlowMetrics): void {
  const {
    crossMax,
    gaps,
    horizontal,
    mainSum,
    paddingCrossEnd,
    paddingCrossStart,
    paddingMainEnd,
    paddingMainStart,
  } = metrics;
  // Figma leaves an auto-layout frame with nothing in its flow at the size it has.
  if (!metrics.flow.length) return;
  const wraps = horizontal && node.layoutWrap === 'WRAP';
  if (node.primaryAxisSizingMode === 'AUTO') {
    const value = paddingMainStart + paddingMainEnd + gaps + mainSum;
    if (horizontal) node.width = value;
    else node.height = value;
  }
  if (node.counterAxisSizingMode === 'AUTO') {
    const value = (wraps ? wrappedHeight(node, metrics) : crossMax) + paddingCrossStart + paddingCrossEnd;
    if (horizontal) node.height = value;
    else node.width = value;
  }
}

/** Incrementally reproduce Figma's HUG sizing when children change. */
export function hugSize(node: MockNode | null | undefined): void {
  if (!node || node.layoutMode === 'NONE') return;
  applyHugSize(node, flowMetrics(node));
}

export function bubble(node: MockNode | null): void {
  let current = node;
  let guard = 0;
  while (current && guard++ < 64) {
    hugSize(current);
    current = current.parent;
  }
}

/** Bottom-up sizing pass, including FILL distribution. */
export function layout(node: MockNode): void {
  for (const child of node.children) layout(child);
  if (node.layoutMode === 'NONE') return;

  const metrics = flowMetrics(node);
  applyHugSize(node, metrics);
  const {
    flow,
    gaps,
    horizontal,
    paddingCrossEnd,
    paddingCrossStart,
    paddingMainEnd,
    paddingMainStart,
  } = metrics;

  const fillers = flow.filter((child) =>
    (horizontal ? child.layoutSizingHorizontal : child.layoutSizingVertical) === 'FILL');
  if (fillers.length && node.primaryAxisSizingMode === 'FIXED') {
    const available = horizontal ? node.width : node.height;
    let fixed = 0;
    for (const child of flow) {
      if (!fillers.includes(child)) fixed += horizontal ? child.width : child.height;
    }
    const leftover = available - paddingMainStart - paddingMainEnd - gaps - fixed;
    const each = Math.max(0, leftover / fillers.length);
    for (const child of fillers) {
      if (horizontal) child.width = each;
      else child.height = each;
      if (child.layoutMode !== 'NONE') layout(child);
      if (child.type === 'TEXT') child._remeasure();
    }
  }

  for (const child of flow) {
    const crossSizing = horizontal
      ? child.layoutSizingVertical
      : child.layoutSizingHorizontal;
    if (crossSizing !== 'FILL') continue;
    const available = (horizontal ? node.height : node.width)
      - paddingCrossStart - paddingCrossEnd;
    if (horizontal) child.height = available;
    else child.width = available;
    if (child.layoutMode !== 'NONE') layout(child);
  }
}

/** Position children using Figma's auto-layout stacking rules. */
export function solveLayout(node: MockNode): void {
  const children = node.children.filter((child) => child.layoutPositioning !== 'ABSOLUTE');
  if (node.layoutMode === 'NONE' || !node.layoutMode) return;
  const vertical = node.layoutMode === 'VERTICAL';
  const paddingStart = vertical ? (node.paddingTop || 0) : (node.paddingLeft || 0);
  const paddingEnd = vertical ? (node.paddingBottom || 0) : (node.paddingRight || 0);
  const paddingCrossStart = vertical ? (node.paddingLeft || 0) : (node.paddingTop || 0);
  const paddingCrossEnd = vertical ? (node.paddingRight || 0) : (node.paddingBottom || 0);
  const gap = node.itemSpacing || 0;
  const box = vertical ? node.height : node.width;
  const cross = vertical ? node.width : node.height;

  if (node.layoutWrap === 'WRAP' && !vertical) {
    const rowGap = node.counterAxisSpacing || 0;
    const available = node.width - paddingStart - paddingEnd;
    let x = paddingStart;
    let y = paddingCrossStart;
    let lineHeight = 0;
    for (const child of children) {
      if (x > paddingStart && x - paddingStart + child.width > available) {
        x = paddingStart;
        y += lineHeight + rowGap;
        lineHeight = 0;
      }
      child.x = x;
      child.y = y;
      x += child.width + gap;
      lineHeight = Math.max(lineHeight, child.height);
    }
    return;
  }

  let content = 0;
  for (const child of children) content += vertical ? child.height : child.width;
  content += Math.max(0, children.length - 1) * gap;
  let cursor = paddingStart;
  const free = box - paddingStart - paddingEnd - content;
  if (node.primaryAxisAlignItems === 'CENTER') cursor = paddingStart + free / 2;
  else if (node.primaryAxisAlignItems === 'MAX') cursor = paddingStart + free;
  const between = node.primaryAxisAlignItems === 'SPACE_BETWEEN' && children.length > 1
    ? free / (children.length - 1)
    : 0;
  for (const child of children) {
    const mainSize = vertical ? child.height : child.width;
    const crossSize = vertical ? child.width : child.height;
    let offset = paddingCrossStart;
    const freeCross = cross - paddingCrossStart - paddingCrossEnd - crossSize;
    if (node.counterAxisAlignItems === 'CENTER') offset = paddingCrossStart + freeCross / 2;
    else if (node.counterAxisAlignItems === 'MAX') offset = paddingCrossStart + freeCross;
    if (vertical) {
      child.y = cursor;
      child.x = offset;
    } else {
      child.x = cursor;
      child.y = offset;
    }
    cursor += mainSize + gap + between;
  }
}
