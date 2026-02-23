/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

// --- 核心常量 ---
const PURPLE_COLOR = "#A020F0";
const PINK_COLOR = "#FF69B4";
const IMAGE_ENLARGE = 11;

// --- 数学函数 ---
const heartFunction = (t: number, centerX: number, centerY: number) => {
  let x = 17 * Math.pow(Math.sin(t), 3);
  let y = -(16 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(3 * t));

  x *= IMAGE_ENLARGE;
  y *= IMAGE_ENLARGE;
  x += centerX;
  y += centerY;

  return { x, y };
};

const scatterInside = (x: number, y: number, centerX: number, centerY: number, beta = 0.15) => {
  const ratioX = -beta * Math.log(Math.random());
  const ratioY = -beta * Math.log(Math.random());
  const dx = ratioX * (x - centerX);
  const dy = ratioY * (y - centerY);
  return { x: x - dx, y: y - dy };
};

const shrink = (x: number, y: number, centerX: number, centerY: number, ratio: number) => {
  const force = -1 / Math.pow(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2), 0.6);
  const dx = ratio * force * (x - centerX);
  const dy = ratio * force * (y - centerY);
  return { x: x - dx, y: y - dy };
};

const curve = (p: number) => {
  return 2 * (2 * Math.sin(4 * p)) / (2 * Math.PI);
};

interface BasePoint {
  x: number;
  y: number;
  size: number;
  color: string;
  type: 'outline' | 'edge' | 'center' | 'halo';
}

class HeartSystem {
  private basePoints: BasePoint[] = [];
  private centerX: number;
  private centerY: number;

  constructor(width: number, height: number) {
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.initBasePoints();
  }

  private initBasePoints() {
    const getColor = () => Math.random() < 0.8 ? PURPLE_COLOR : PINK_COLOR;

    // 1. 轮廓点
    for (let i = 0; i < 1000; i++) {
      const t = Math.random() * 2 * Math.PI;
      const { x, y } = heartFunction(t, this.centerX, this.centerY);
      this.basePoints.push({ x, y, size: Math.random() * 2 + 1, color: getColor(), type: 'outline' });
    }

    // 2. 边缘扩散
    const outlineCopy = [...this.basePoints];
    outlineCopy.forEach(p => {
      for (let i = 0; i < 3; i++) {
        const { x, y } = scatterInside(p.x, p.y, this.centerX, this.centerY, 0.05);
        this.basePoints.push({ x, y, size: Math.random() * 1.5 + 1, color: getColor(), type: 'edge' });
      }
    });

    // 3. 中心扩散
    for (let i = 0; i < 4000; i++) {
      const p = outlineCopy[Math.floor(Math.random() * outlineCopy.length)];
      const { x, y } = scatterInside(p.x, p.y, this.centerX, this.centerY, 0.27);
      this.basePoints.push({ x, y, size: Math.random() * 1.5 + 1, color: getColor(), type: 'center' });
    }
  }

  public render(ctx: CanvasRenderingContext2D, time: number) {
    // 计算当前跳动比例
    const p = (time / 10) * Math.PI;
    const beatValue = curve(p);
    const ratio = 15 * beatValue;
    const haloRadius = 4 + 6 * (1 + beatValue);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制粒子
    this.basePoints.forEach(p => {
      let drawX = p.x;
      let drawY = p.y;

      const force = 1 / Math.pow(Math.pow(p.x - this.centerX, 2) + Math.pow(p.y - this.centerY, 2), 0.420);
      const dx = ratio * force * (p.x - this.centerX) + (Math.random() * 2 - 1);
      const dy = ratio * force * (p.y - this.centerY) + (Math.random() * 2 - 1);
      
      drawX -= dx;
      drawY -= dy;

      ctx.fillStyle = p.color;
      ctx.fillRect(drawX, drawY, p.size, p.size);
    });

    // 绘制动态光环 (实时生成以保持随机感)
    const haloNumber = Math.floor(1000 + 1000 * Math.pow(Math.abs(beatValue), 2));
    for (let i = 0; i < haloNumber; i++) {
      const t = Math.random() * 2 * Math.PI;
      let { x, y } = heartFunction(t, this.centerX, this.centerY);
      ({ x, y } = shrink(x, y, this.centerX, this.centerY, haloRadius));
      x += (Math.random() * 120 - 60);
      y += (Math.random() * 120 - 60);
      ctx.fillStyle = Math.random() < 0.8 ? PURPLE_COLOR : PINK_COLOR;
      ctx.fillRect(x, y, Math.random() < 0.5 ? 1 : 2, Math.random() < 0.5 ? 1 : 2);
    }

    // 绘制文字
    const scale = 1 - beatValue * 0.2;
    const opacity = 0.7 + beatValue * 0.3;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.scale(scale, scale);
    ctx.font = 'bold 48px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 荧光效果
    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
    ctx.fillText('Heart Beat', 0, 0);

    ctx.shadowBlur = 30;
    ctx.fillText('Heart Beat', 0, 0);

    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255, 220, 220, ${opacity})`;
    ctx.fillText('Heart Beat', 0, 0);
    ctx.restore();
  }
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartSystemRef = useRef<HeartSystem | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      heartSystemRef.current = new HeartSystem(canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    let animationId: number;
    const render = () => {
      if (heartSystemRef.current && ctx) {
        heartSystemRef.current.render(ctx, timeRef.current);
        // 这里的 1/15 是你要求的速度，现在它会非常平滑
        timeRef.current += 1/15;
      }
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="block" />
      <div className="absolute bottom-8 text-white/10 font-mono text-[10px] tracking-[0.3em] uppercase pointer-events-none">
        Deeply Synchronized Particle System
      </div>
    </div>
  );
}
