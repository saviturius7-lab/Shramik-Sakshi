import React, { useEffect, useRef } from 'react';

interface ArtisticLandscapeProps {
  opacity?: number;
}

interface SmoothCloud {
  x: number;
  y: number;
  speed: number;
  w: number;
  h: number;
  opacity: number;
  driftY: number;
  variant: 0 | 1 | 2;
}

interface Bird {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  wingPhase: number;
  wingSpeed: number;
}

export const BoidsCanvas: React.FC<ArtisticLandscapeProps> = ({ opacity = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handlePointerMove = (e: PointerEvent) => {
      // Subtle parallax offset (-1 to 1)
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', handlePointerMove);

    // --------------------------------------------------------------------------------
    // 1. SMOOTH FULLY WHITE CLOUDS (Pure white, continuous pillowy curves, NO black lines, NO circles)
    // --------------------------------------------------------------------------------
    const clouds: SmoothCloud[] = [
      {
        x: width * 0.12,
        y: height * 0.12,
        speed: 0.16,
        w: 220,
        h: 75,
        opacity: 0.96,
        driftY: 0,
        variant: 0,
      },
      {
        x: width * 0.52,
        y: height * 0.07,
        speed: 0.12,
        w: 260,
        h: 88,
        opacity: 0.98,
        driftY: 1.4,
        variant: 2,
      },
      {
        x: width * 0.82,
        y: height * 0.18,
        speed: 0.2,
        w: 180,
        h: 62,
        opacity: 0.94,
        driftY: 2.8,
        variant: 1,
      },
      {
        x: width * 0.04,
        y: height * 0.28,
        speed: 0.14,
        w: 210,
        h: 70,
        opacity: 0.95,
        driftY: 4.1,
        variant: 0,
      },
      {
        x: width * 0.68,
        y: height * 0.32,
        speed: 0.11,
        w: 190,
        h: 64,
        opacity: 0.92,
        driftY: 1.9,
        variant: 1,
      },
    ];

    // --------------------------------------------------------------------------------
    // 2. BIRDS / SWALLOWS
    // --------------------------------------------------------------------------------
    const birds: Bird[] = Array.from({ length: 8 }, (_, i) => ({
      x: width * 0.22 + (i * 85) + Math.random() * 35,
      y: height * 0.14 + (Math.sin(i) * 50) + Math.random() * 25,
      vx: 0.42 + Math.random() * 0.3,
      vy: (Math.random() - 0.5) * 0.15,
      size: 8 + Math.random() * 3.5,
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 0.13 + Math.random() * 0.05,
    }));

    // Grass marks on fields (pre-computed coordinates for performance)
    const grassMarks: Array<{ xRatio: number; yOffset: number; len: number; angle: number }> = [];
    for (let i = 0; i < 160; i++) {
      grassMarks.push({
        xRatio: Math.random(),
        yOffset: 25 + Math.random() * 340,
        len: 7 + Math.random() * 8,
        angle: -0.22 + Math.random() * 0.44,
      });
    }

    // --------------------------------------------------------------------------------
    // RENDER FUNCTIONS
    // --------------------------------------------------------------------------------

    // Draw Artistic 2D Pink-Yellowish Sky with Gradient
    const drawSky = () => {
      // Artistic Pink into Yellowish Horizon Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.75);
      skyGrad.addColorStop(0, '#eb789c'); // Rich warm storybook pink
      skyGrad.addColorStop(0.35, '#f49ab8'); // Radiant pastel pink
      skyGrad.addColorStop(0.62, '#fec397'); // Warm peach-coral
      skyGrad.addColorStop(0.88, '#fde68a'); // Luminous golden sunset yellow
      skyGrad.addColorStop(1, '#fff3b0'); // Radiant horizon glow

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Soft sun warmth glow near right-center horizon
      const sunX = width * 0.65;
      const sunY = height * 0.52;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, width * 0.4);
      sunGrad.addColorStop(0, 'rgba(255, 250, 220, 0.45)');
      sunGrad.addColorStop(0.4, 'rgba(254, 230, 138, 0.22)');
      sunGrad.addColorStop(1, 'rgba(254, 230, 138, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, width, height);
    };

    // Draw Smooth, Fully White Pillowy Cloud (NO circles, NO black lines, pure white)
    const drawCloud = (c: SmoothCloud, parallaxX: number) => {
      ctx.save();
      const cx = c.x + parallaxX * 0.3;
      const cy = c.y + Math.sin(c.driftY) * 5;
      ctx.translate(cx, cy);

      const w = c.w;
      const h = c.h;

      // Fully pure white cloud fill - NO black stroke, NO outlines
      ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;

      ctx.beginPath();
      if (c.variant === 0) {
        // Variant 0: Elegant rolling cumulus with soft flat base and sculpted billowing top
        ctx.moveTo(-w * 0.46, h * 0.25);
        // Smooth gentle base
        ctx.quadraticCurveTo(0, h * 0.28, w * 0.46, h * 0.25);
        // Right flank curve
        ctx.bezierCurveTo(w * 0.53, h * 0.18, w * 0.54, -h * 0.12, w * 0.42, -h * 0.24);
        // Top right swell
        ctx.bezierCurveTo(w * 0.38, -h * 0.52, w * 0.16, -h * 0.58, w * 0.05, -h * 0.38);
        // Highest central swell
        ctx.bezierCurveTo(-w * 0.04, -h * 0.72, -w * 0.25, -h * 0.68, -w * 0.3, -h * 0.35);
        // Left flank curve
        ctx.bezierCurveTo(-w * 0.44, -h * 0.42, -w * 0.54, -h * 0.12, -w * 0.46, h * 0.25);
      } else if (c.variant === 1) {
        // Variant 1: Elongated, graceful, smooth stratus cloud
        ctx.moveTo(-w * 0.48, h * 0.2);
        ctx.quadraticCurveTo(0, h * 0.22, w * 0.48, h * 0.2);
        ctx.bezierCurveTo(w * 0.55, h * 0.12, w * 0.52, -h * 0.16, w * 0.36, -h * 0.28);
        ctx.bezierCurveTo(w * 0.26, -h * 0.45, w * 0.06, -h * 0.46, -w * 0.06, -h * 0.3);
        ctx.bezierCurveTo(-w * 0.18, -h * 0.55, -w * 0.36, -h * 0.5, -w * 0.42, -h * 0.22);
        ctx.bezierCurveTo(-w * 0.54, -h * 0.12, -w * 0.55, h * 0.12, -w * 0.48, h * 0.2);
      } else {
        // Variant 2: Grand fluffy pillowy formation with triple soft crests
        ctx.moveTo(-w * 0.46, h * 0.28);
        ctx.quadraticCurveTo(0, h * 0.3, w * 0.46, h * 0.28);
        ctx.bezierCurveTo(w * 0.54, h * 0.2, w * 0.55, -h * 0.08, w * 0.44, -h * 0.22);
        ctx.bezierCurveTo(w * 0.42, -h * 0.5, w * 0.22, -h * 0.58, w * 0.12, -h * 0.42);
        ctx.bezierCurveTo(w * 0.04, -h * 0.78, -w * 0.18, -h * 0.76, -w * 0.22, -h * 0.45);
        ctx.bezierCurveTo(-w * 0.32, -h * 0.6, -w * 0.45, -h * 0.48, -w * 0.42, -h * 0.2);
        ctx.bezierCurveTo(-w * 0.55, -h * 0.08, -w * 0.54, h * 0.2, -w * 0.46, h * 0.28);
      }
      ctx.closePath();
      ctx.fill();

      // Subtle, pure-white soft highlights for natural depth (NO black lines, pure white)
      ctx.fillStyle = `rgba(255, 255, 255, 0.45)`;
      ctx.beginPath();
      ctx.ellipse(-w * 0.1, -h * 0.28, w * 0.26, h * 0.2, -0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(w * 0.18, -h * 0.18, w * 0.18, h * 0.15, 0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Draw Rolling Green Fields (Endless fields till the horizon)
    const drawFields = (parallaxX: number, parallaxY: number) => {
      const horizonY = height * 0.54 + parallaxY * 8;

      ctx.save();

      // --- LAYER 1: Distant Horizon Ridge (Gentle olive green) ---
      ctx.fillStyle = '#7a9632';
      ctx.strokeStyle = '#232b28';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-50, horizonY);
      ctx.bezierCurveTo(
        width * 0.25 + parallaxX * 5,
        horizonY - 26,
        width * 0.55 + parallaxX * 5,
        horizonY + 18,
        width + 50,
        horizonY - 15
      );
      ctx.lineTo(width + 50, height + 50);
      ctx.lineTo(-50, height + 50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // --- LAYER 2: Mid-distance Rolling Hill (Lush spring green) ---
      const midHillY = horizonY + 35;
      ctx.fillStyle = '#8ca838';
      ctx.beginPath();
      ctx.moveTo(-50, midHillY + 30);
      ctx.bezierCurveTo(
        width * 0.3 + parallaxX * 8,
        midHillY - 32,
        width * 0.7 + parallaxX * 8,
        midHillY + 12,
        width + 50,
        midHillY - 45
      );
      ctx.lineTo(width + 50, height + 50);
      ctx.lineTo(-50, height + 50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // --- LAYER 3: Main Foreground Rolling Slope ---
      const foreY = horizonY + 70;
      ctx.fillStyle = '#9cb63e';
      ctx.beginPath();
      ctx.moveTo(-50, foreY + 45);
      ctx.bezierCurveTo(
        width * 0.35 + parallaxX * 12,
        foreY - 20,
        width * 0.75 + parallaxX * 12,
        foreY + 28,
        width + 50,
        foreY - 35
      );
      ctx.lineTo(width + 50, height + 50);
      ctx.lineTo(-50, height + 50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // --- Winding Country Lane / Path ---
      const houseX = width * 0.52 + parallaxX * 10;
      const houseY = foreY + 12;

      ctx.fillStyle = '#ebd689';
      ctx.strokeStyle = '#232b28';
      ctx.lineWidth = 2.0;

      ctx.beginPath();
      ctx.moveTo(width * 0.44 + parallaxX * 18, height + 10);
      ctx.bezierCurveTo(
        width * 0.48 + parallaxX * 14,
        height * 0.88,
        width * 0.42 + parallaxX * 12,
        houseY + 90,
        houseX - 5,
        houseY + 34
      );
      ctx.lineTo(houseX + 11, houseY + 34);
      ctx.bezierCurveTo(
        width * 0.46 + parallaxX * 12,
        houseY + 90,
        width * 0.54 + parallaxX * 14,
        height * 0.88,
        width * 0.52 + parallaxX * 18,
        height + 10
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Path inner texture
      ctx.strokeStyle = 'rgba(140, 103, 33, 0.4)';
      ctx.lineWidth = 1.2;
      for (let s = 0; s < 12; s++) {
        const py = houseY + 45 + s * ((height - houseY) / 13);
        const px = width * 0.47 + Math.sin(s * 0.8) * 16 + parallaxX * 14;
        ctx.beginPath();
        ctx.moveTo(px - 3, py);
        ctx.lineTo(px + 4, py + 1);
        ctx.stroke();
      }

      // Grass marks
      ctx.strokeStyle = '#4e621d';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      grassMarks.forEach((gm) => {
        const gx = gm.xRatio * width + parallaxX * 10;
        const gy = horizonY + gm.yOffset;
        if (gy < height + 20 && gy > horizonY) {
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + Math.sin(gm.angle) * gm.len, gy - Math.cos(gm.angle) * gm.len);
          ctx.moveTo(gx + 3, gy);
          ctx.lineTo(gx + 3 + Math.sin(gm.angle + 0.3) * (gm.len * 0.8), gy - Math.cos(gm.angle + 0.3) * (gm.len * 0.8));
          ctx.stroke();
        }
      });

      ctx.restore();

      return { houseX, houseY };
    };

    // Draw Country Cottage House (NO CHIMNEY, clean pitched roof as requested)
    const drawHouse = (hx: number, hy: number) => {
      ctx.save();
      ctx.translate(hx, hy);

      const houseW = 76;
      const houseH = 68;
      const roofH = 34;

      ctx.strokeStyle = '#232b28';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // 1. House Body (Two-story pink cottage)
      ctx.fillStyle = '#f0789a';
      ctx.fillRect(-houseW / 2, 0, houseW, houseH);
      ctx.strokeRect(-houseW / 2, 0, houseW, houseH);

      // Mid-floor dividing line
      ctx.beginPath();
      ctx.moveTo(-houseW / 2, houseH * 0.5);
      ctx.lineTo(houseW / 2, houseH * 0.5);
      ctx.stroke();

      // 2. Pitched Gable Roof (NO chimney!)
      ctx.fillStyle = '#c73a62';
      ctx.beginPath();
      ctx.moveTo(-houseW / 2 - 8, 0);
      ctx.lineTo(0, -roofH);
      ctx.lineTo(houseW / 2 + 8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Roof dormer window in center attic
      const dormerW = 16;
      const dormerH = 15;
      const dormerX = -dormerW / 2;
      const dormerY = -roofH * 0.58;

      ctx.fillStyle = '#f0789a';
      ctx.fillRect(dormerX, dormerY, dormerW, dormerH);
      ctx.strokeRect(dormerX, dormerY, dormerW, dormerH);

      // Dormer pitched cap
      ctx.fillStyle = '#c73a62';
      ctx.beginPath();
      ctx.moveTo(dormerX - 2, dormerY);
      ctx.lineTo(0, dormerY - 8);
      ctx.lineTo(dormerX + dormerW + 2, dormerY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dormer glass
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(dormerX + 3, dormerY + 3, dormerW - 6, dormerH - 5);
      ctx.strokeRect(dormerX + 3, dormerY + 3, dormerW - 6, dormerH - 5);

      // 3. Windows with Dark Shutters
      const drawWindow = (wx: number, wy: number) => {
        const winW = 13;
        const winH = 16;
        const shutterW = 4.5;

        // Warm yellow glass with interior light
        ctx.fillStyle = '#fff4bd';
        ctx.fillRect(wx - winW / 2, wy - winH / 2, winW, winH);
        ctx.strokeRect(wx - winW / 2, wy - winH / 2, winW, winH);

        // Window grid mullions
        ctx.beginPath();
        ctx.moveTo(wx, wy - winH / 2);
        ctx.lineTo(wx, wy + winH / 2);
        ctx.moveTo(wx - winW / 2, wy);
        ctx.lineTo(wx + winW / 2, wy);
        ctx.stroke();

        // Dark shutters on sides
        ctx.fillStyle = '#232b28';
        ctx.fillRect(wx - winW / 2 - shutterW - 1, wy - winH / 2, shutterW, winH);
        ctx.strokeRect(wx - winW / 2 - shutterW - 1, wy - winH / 2, shutterW, winH);
        ctx.fillRect(wx + winW / 2 + 1, wy - winH / 2, shutterW, winH);
        ctx.strokeRect(wx + winW / 2 + 1, wy - winH / 2, shutterW, winH);
      };

      // Upper floor windows: left, center, right
      drawWindow(-houseW * 0.28, houseH * 0.26);
      drawWindow(0, houseH * 0.26);
      drawWindow(houseW * 0.28, houseH * 0.26);

      // Lower floor windows: left and right
      drawWindow(-houseW * 0.28, houseH * 0.74);
      drawWindow(houseW * 0.28, houseH * 0.74);

      // 4. Front Entrance Door
      const doorW = 15;
      const doorH = 24;
      const doorX = -doorW / 2;
      const doorY = houseH - doorH;

      ctx.fillStyle = '#5c2d38';
      ctx.fillRect(doorX, doorY, doorW, doorH);
      ctx.strokeRect(doorX, doorY, doorW, doorH);

      // Door panels
      ctx.fillStyle = '#7a3e4c';
      ctx.fillRect(doorX + 2.5, doorY + 3, doorW - 5, doorH * 0.42);
      ctx.fillRect(doorX + 2.5, doorY + doorH * 0.52, doorW - 5, doorH * 0.4);
      ctx.strokeRect(doorX + 2.5, doorY + 3, doorW - 5, doorH * 0.42);
      ctx.strokeRect(doorX + 2.5, doorY + doorH * 0.52, doorW - 5, doorH * 0.4);

      // Brass door knob
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(doorX + doorW - 3.5, doorY + doorH * 0.54, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Stone entry doorstep
      ctx.fillStyle = '#d5c4a1';
      ctx.fillRect(doorX - 3, houseH, doorW + 6, 4.5);
      ctx.strokeRect(doorX - 3, houseH, doorW + 6, 4.5);

      ctx.restore();
    };

    // Draw Birds / Swallows Soaring
    const updateAndDrawBirds = () => {
      ctx.save();
      ctx.strokeStyle = '#232b28';
      ctx.fillStyle = '#232b28';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';

      birds.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy + Math.sin(b.wingPhase) * 0.35;
        b.wingPhase += b.wingSpeed;

        if (b.x > width + 40) b.x = -40;

        const flap = Math.sin(b.wingPhase) * (b.size * 0.5);

        ctx.beginPath();
        ctx.moveTo(b.x - b.size, b.y - flap);
        ctx.quadraticCurveTo(b.x - b.size * 0.4, b.y + flap * 0.5, b.x, b.y);
        ctx.quadraticCurveTo(b.x + b.size * 0.4, b.y + flap * 0.5, b.x + b.size, b.y - flap);
        ctx.stroke();
      });

      ctx.restore();
    };

    // --------------------------------------------------------------------------------
    // 60FPS ANIMATION LOOP
    // --------------------------------------------------------------------------------
    const render = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const pX = mouseRef.current.x * 20;
      const pY = mouseRef.current.y * 12;

      ctx.clearRect(0, 0, width, height);

      // 1. Sky & Golden-Yellow Horizon
      drawSky();

      // 2. Fully White Smooth Clouds (NO circles, NO black lines)
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        cloud.driftY += 0.015;
        if (cloud.x > width + 300) cloud.x = -300;
        drawCloud(cloud, pX);
      });

      // 3. Birds soaring
      updateAndDrawBirds();

      // 4. Rolling Green Fields & Winding Path
      const { houseX, houseY } = drawFields(pX, pY);

      // 5. Cottage House (Chimney completely removed)
      drawHouse(houseX, houseY);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 no-print"
      style={{ opacity, width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
};

export default BoidsCanvas;
