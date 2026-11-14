import React, { useEffect, useRef } from 'react';

interface ArtisticLandscapeProps {
  opacity?: number;
  flockSize?: number;
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

interface ShockwaveRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  opacity: number;
}

// --------------------------------------------------------------------------------
// 2D VECTOR UTILITY FOR CRAIG REYNOLDS FLOCKING
// --------------------------------------------------------------------------------
class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  add(v: Vec2): Vec2 {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vec2): Vec2 {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n: number): Vec2 {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n: number): Vec2 {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  heading(): number {
    return Math.atan2(this.y, this.x);
  }

  normalize(): Vec2 {
    const m = this.mag();
    if (m > 0.00001) {
      this.div(m);
    }
    return this;
  }

  limit(max: number): Vec2 {
    const mSq = this.magSq();
    if (mSq > max * max) {
      this.div(Math.sqrt(mSq)).mult(max);
    }
    return this;
  }

  dist(v: Vec2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }
}

// --------------------------------------------------------------------------------
// CRAIG REYNOLDS BOID CLASS: SEPARATION, ALIGNMENT, COHESION & WING KINEMATICS
// --------------------------------------------------------------------------------
class FlockBoid {
  pos: Vec2;
  vel: Vec2;
  acc: Vec2;
  zDepth: number; // 0.45 (distant) to 1.0 (foreground)
  maxSpeed: number;
  maxForce: number;
  wingPhase: number;
  wingSpeed: number;
  prevHeading: number;
  bankAngle: number;
  size: number;
  isGliding: boolean;
  subFlockId: number;

  constructor(width: number, height: number, subFlockId: number = 0) {
    // Distribute birds across the sky zone (upper 50% of viewport)
    const initX = Math.random() * width;
    const initY = height * 0.06 + Math.random() * (height * 0.42);
    this.pos = new Vec2(initX, initY);

    // Initial velocity: gentle eastward/southeast drift with natural variation
    const initialAngle = -0.15 + (Math.random() - 0.5) * 0.7;
    const initialSpeed = 1.8 + Math.random() * 1.4;
    this.vel = new Vec2(Math.cos(initialAngle) * initialSpeed, Math.sin(initialAngle) * initialSpeed);
    this.acc = new Vec2(0, 0);

    // Depth layer for parallax depth perception
    this.zDepth = 0.45 + Math.random() * 0.55;
    this.size = (7 + Math.random() * 4) * this.zDepth;
    this.maxSpeed = (2.2 + Math.random() * 1.6) * (0.7 + this.zDepth * 0.3);
    this.maxForce = 0.07 + Math.random() * 0.04;

    this.wingPhase = Math.random() * Math.PI * 2;
    this.wingSpeed = 0.16;
    this.prevHeading = this.vel.heading();
    this.bankAngle = 0;
    this.isGliding = false;
    this.subFlockId = subFlockId;
  }

  applyForce(force: Vec2) {
    this.acc.add(force);
  }

  // Craig Reynolds Steering Rule 1: Separation
  // Steer to avoid crowding local flockmates
  separate(boids: FlockBoid[]): Vec2 {
    const desiredSeparation = 32 * this.zDepth;
    const steer = new Vec2(0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      const other = boids[i];
      if (other === this) continue;
      const d = this.pos.dist(other.pos);
      if (d > 0 && d < desiredSeparation) {
        // Calculate vector pointing away from neighbor, weighted inversely by distance
        const diff = this.pos.clone().sub(other.pos);
        diff.normalize();
        diff.div(d); // Closer neighbors push harder
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
      if (steer.mag() > 0) {
        steer.normalize();
        steer.mult(this.maxSpeed);
        steer.sub(this.vel);
        steer.limit(this.maxForce * 1.5);
      }
    }
    return steer;
  }

  // Craig Reynolds Steering Rule 2: Alignment
  // Steer towards the average heading/velocity of local flockmates
  align(boids: FlockBoid[]): Vec2 {
    const neighborDist = 80 * this.zDepth;
    const sum = new Vec2(0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      const other = boids[i];
      if (other === this) continue;
      // Slight preference for own sub-flock
      const sameSubFlockBonus = other.subFlockId === this.subFlockId ? 1.2 : 0.8;
      const d = this.pos.dist(other.pos);
      if (d > 0 && d < neighborDist * sameSubFlockBonus) {
        sum.add(other.vel);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      const steer = sum.sub(this.vel);
      steer.limit(this.maxForce);
      return steer;
    }
    return new Vec2(0, 0);
  }

  // Craig Reynolds Steering Rule 3: Cohesion
  // Steer towards the average position (center of mass) of local flockmates
  cohere(boids: FlockBoid[]): Vec2 {
    const neighborDist = 110 * this.zDepth;
    const sum = new Vec2(0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      const other = boids[i];
      if (other === this) continue;
      const sameSubFlockBonus = other.subFlockId === this.subFlockId ? 1.25 : 0.75;
      const d = this.pos.dist(other.pos);
      if (d > 0 && d < neighborDist * sameSubFlockBonus) {
        sum.add(other.pos);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    }
    return new Vec2(0, 0);
  }

  // Seek target position
  seek(target: Vec2): Vec2 {
    const desired = target.clone().sub(this.pos);
    desired.normalize();
    desired.mult(this.maxSpeed);
    const steer = desired.sub(this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  // Sky Boundaries: Gentle soft containment within upper sky zone
  containSky(width: number, height: number): Vec2 {
    const steer = new Vec2(0, 0);
    const topMargin = height * 0.04;
    const horizonLimit = height * 0.52; // Maintain altitude above green rolling hills

    if (this.pos.y < topMargin) {
      steer.y = (topMargin - this.pos.y) * 0.04;
    } else if (this.pos.y > horizonLimit) {
      steer.y = (horizonLimit - this.pos.y) * 0.05;
    }

    // Natural eastward cruising bias
    if (this.vel.x < 0.6) {
      steer.x += 0.04;
    }

    return steer;
  }

  // Pointer Evasion / Gentle Curiosity
  reactToPointer(pointerX: number, pointerY: number, hasPointer: boolean): Vec2 {
    if (!hasPointer) return new Vec2(0, 0);

    const pointerPos = new Vec2(pointerX, pointerY);
    const d = this.pos.dist(pointerPos);
    const avoidDist = 140;

    // Startle & evade pointer if cursor gets too close
    if (d > 0 && d < avoidDist) {
      const diff = this.pos.clone().sub(pointerPos);
      diff.normalize();
      // Strong repulsion inversely proportional to distance
      diff.mult(this.maxSpeed * 1.8);
      const steer = diff.sub(this.vel);
      steer.limit(this.maxForce * 2.8);
      return steer;
    }
    return new Vec2(0, 0);
  }

  // Shockwave Ripple Reaction
  reactToRipples(ripples: ShockwaveRipple[]): Vec2 {
    const steer = new Vec2(0, 0);
    for (let i = 0; i < ripples.length; i++) {
      const rip = ripples[i];
      const d = this.pos.dist(new Vec2(rip.x, rip.y));
      // Bird affected near the wavefront
      const waveBand = Math.abs(d - rip.radius);
      if (waveBand < 45 && rip.opacity > 0.1) {
        const diff = this.pos.clone().sub(new Vec2(rip.x, rip.y));
        diff.normalize();
        diff.mult(rip.strength * this.maxSpeed * 2.2);
        steer.add(diff);
      }
    }
    return steer.limit(this.maxForce * 3.5);
  }

  // Update physical kinematics, flapping & banking
  update(
    boids: FlockBoid[],
    width: number,
    height: number,
    pointerX: number,
    pointerY: number,
    hasPointer: boolean,
    ripples: ShockwaveRipple[]
  ) {
    // 1. Calculate Reynolds Flocking Forces
    const sep = this.separate(boids);
    const ali = this.align(boids);
    const coh = this.cohere(boids);
    const skyBound = this.containSky(width, height);
    const evade = this.reactToPointer(pointerX, pointerY, hasPointer);
    const rippleImpulse = this.reactToRipples(ripples);

    // Weights: authentic avian balance
    sep.mult(1.75);
    ali.mult(1.15);
    coh.mult(0.95);
    skyBound.mult(1.3);
    evade.mult(2.4);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
    this.applyForce(skyBound);
    this.applyForce(evade);
    this.applyForce(rippleImpulse);

    // 2. Natural Wandering / Wind Fluctuation
    const windNoise = new Vec2(
      Math.sin(this.wingPhase * 0.4) * 0.02,
      Math.cos(this.wingPhase * 0.3) * 0.025
    );
    this.applyForce(windNoise);

    // 3. Integrate Velocity & Position
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0); // Reset acceleration

    // 4. Wrap horizontally around world bounds
    if (this.pos.x > width + 60) {
      this.pos.x = -60;
      this.pos.y = height * 0.08 + Math.random() * (height * 0.38);
    } else if (this.pos.x < -60) {
      this.pos.x = width + 60;
      this.pos.y = height * 0.08 + Math.random() * (height * 0.38);
    }

    // 5. Dynamic Banking (Roll Angle) Calculation based on Angular Steering
    const currentHeading = this.vel.heading();
    let dHeading = currentHeading - this.prevHeading;
    // Normalize angle delta between -PI and PI
    while (dHeading > Math.PI) dHeading -= Math.PI * 2;
    while (dHeading < -Math.PI) dHeading += Math.PI * 2;

    // Smoothly tilt bird into turn (up to 32 degrees)
    const targetBank = Math.max(-0.55, Math.min(0.55, dHeading * 9.0));
    this.bankAngle += (targetBank - this.bankAngle) * 0.14;
    this.prevHeading = currentHeading;

    // 6. Wing Flap Kinematics: Fast flapping during turns & bursts, graceful glides during steady flight
    const speedRatio = this.vel.mag() / this.maxSpeed;
    const isTurning = Math.abs(dHeading) > 0.015 || evade.mag() > 0.1;

    if (isTurning || speedRatio > 0.88 || Math.random() < 0.02) {
      this.isGliding = false;
      this.wingSpeed = 0.22 + speedRatio * 0.12;
    } else if (Math.random() < 0.015) {
      // Periodic glide mode
      this.isGliding = true;
    }

    if (!this.isGliding) {
      this.wingPhase += this.wingSpeed;
    } else {
      // In glide mode, wings gently breathe in open crescent
      this.wingPhase = Math.PI * 0.15 + Math.sin(Date.now() * 0.003) * 0.08;
    }
  }

  // Draw Authentic Avian Swallow Silhouette with Articulated Flapping Wings & Scissor Tail
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    const heading = this.vel.heading();
    ctx.rotate(heading);

    // Apply roll bank transformation
    ctx.scale(1, Math.cos(this.bankAngle));

    const s = this.size;
    const flap = Math.sin(this.wingPhase);
    // Dynamic wing flap deflection: upstroke fold vs downstroke sweep
    const wingDip = flap * (s * 0.75);

    // Color: Hand-inked charcoal / deep slate-black matching tactile civic ledger
    const alpha = 0.72 + this.zDepth * 0.28;
    ctx.fillStyle = `rgba(28, 36, 33, ${alpha})`;
    ctx.strokeStyle = `rgba(28, 36, 33, ${alpha})`;
    ctx.lineWidth = Math.max(1.2, 1.8 * this.zDepth);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Sleek Aerodynamic Body (Fuselage)
    ctx.beginPath();
    // Beak tip
    ctx.moveTo(s * 1.3, 0);
    // Right flank to shoulder
    ctx.quadraticCurveTo(s * 0.6, s * 0.22, 0, s * 0.25);
    // Waist to rump
    ctx.quadraticCurveTo(-s * 0.7, s * 0.18, -s * 1.1, 0);
    // Left rump to waist
    ctx.quadraticCurveTo(-s * 0.7, -s * 0.18, 0, -s * 0.25);
    // Shoulder to beak
    ctx.quadraticCurveTo(s * 0.6, -s * 0.22, s * 1.3, 0);
    ctx.closePath();
    ctx.fill();

    // 2. Swallow Scissor Fork Tail
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, 0);
    // Left outer streamer
    ctx.lineTo(-s * 2.1, -s * 0.45);
    // Inner tail fork notch
    ctx.lineTo(-s * 1.3, 0);
    // Right outer streamer
    ctx.lineTo(-s * 2.1, s * 0.45);
    ctx.closePath();
    ctx.fill();

    // 3. Articulated Swept-back Wings with Primary Feathers
    // Left Wing (Port)
    ctx.beginPath();
    ctx.moveTo(s * 0.35, -s * 0.1);
    // Elbow curve
    ctx.bezierCurveTo(
      s * 0.1,
      -s * 0.9 - wingDip * 0.4,
      -s * 0.3,
      -s * 1.5 - wingDip * 0.8,
      -s * 0.7,
      -s * 2.2 - wingDip
    );
    // Trailing feather edge
    ctx.bezierCurveTo(
      -s * 0.5,
      -s * 1.4 - wingDip * 0.7,
      -s * 0.1,
      -s * 0.8 - wingDip * 0.3,
      -s * 0.2,
      -s * 0.1
    );
    ctx.closePath();
    ctx.fill();

    // Right Wing (Starboard)
    ctx.beginPath();
    ctx.moveTo(s * 0.35, s * 0.1);
    // Elbow curve
    ctx.bezierCurveTo(
      s * 0.1,
      s * 0.9 + wingDip * 0.4,
      -s * 0.3,
      s * 1.5 + wingDip * 0.8,
      -s * 0.7,
      s * 2.2 + wingDip
    );
    // Trailing feather edge
    ctx.bezierCurveTo(
      -s * 0.5,
      s * 1.4 + wingDip * 0.7,
      -s * 0.1,
      s * 0.8 + wingDip * 0.3,
      -s * 0.2,
      s * 0.1
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// --------------------------------------------------------------------------------
// MAIN COMPONENT: ARTISTIC LANDSCAPE + CRAIG REYNOLDS BOIDS FLOCK
// --------------------------------------------------------------------------------
export const BoidsCanvas: React.FC<ArtisticLandscapeProps> = ({ 
  opacity = 1,
  flockSize = 38 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ 
    x: number; 
    y: number; 
    targetX: number; 
    targetY: number;
    hasPointer: boolean;
  }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    hasPointer: false,
  });

  const ripplesRef = useRef<ShockwaveRipple[]>([]);
  const boidsRef = useRef<FlockBoid[]>([]);

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
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.hasPointer = true;
    };

    const handlePointerLeave = () => {
      mouseRef.current.hasPointer = false;
    };

    // User click or tap triggers an acoustic/wind disturbance ripple that scatters the flock
    const triggerScatterRipple = (cx: number, cy: number) => {
      ripplesRef.current.push({
        x: cx,
        y: cy,
        radius: 8,
        maxRadius: Math.min(width, height) * 0.55,
        strength: 1.6,
        opacity: 0.8,
      });
    };

    const handlePointerDown = (e: PointerEvent) => {
      triggerScatterRipple(e.clientX, e.clientY);
    };

    // Listen to global app-level scatter events (e.g. from Header button)
    const handleGlobalScatter = (e: Event) => {
      const customEvent = e as CustomEvent<{ x?: number; y?: number }>;
      const cx = customEvent.detail?.x ?? width * 0.5;
      const cy = customEvent.detail?.y ?? height * 0.25;
      triggerScatterRipple(cx, cy);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('shramik-scatter-flock', handleGlobalScatter as EventListener);

    // --------------------------------------------------------------------------------
    // 1. INITIALIZE CRAIG REYNOLDS BOIDS FLOCK (38 Birds in 3 Organic Sub-flocks)
    // --------------------------------------------------------------------------------
    const boids: FlockBoid[] = [];
    const count = flockSize || 38;
    for (let i = 0; i < count; i++) {
      // Group into 3 natural sub-flocks across the twilight sky
      const subFlockId = i % 3;
      boids.push(new FlockBoid(width, height, subFlockId));
    }
    boidsRef.current = boids;

    // --------------------------------------------------------------------------------
    // 2. SMOOTH FULLY WHITE CLOUDS (Continuous pillowy curves, NO black lines, NO circles)
    // --------------------------------------------------------------------------------
    const clouds: SmoothCloud[] = [
      {
        x: width * 0.12,
        y: height * 0.11,
        speed: 0.16,
        w: 230,
        h: 76,
        opacity: 0.96,
        driftY: 0,
        variant: 0,
      },
      {
        x: width * 0.52,
        y: height * 0.07,
        speed: 0.12,
        w: 270,
        h: 90,
        opacity: 0.98,
        driftY: 1.4,
        variant: 2,
      },
      {
        x: width * 0.82,
        y: height * 0.17,
        speed: 0.2,
        w: 190,
        h: 65,
        opacity: 0.94,
        driftY: 2.8,
        variant: 1,
      },
      {
        x: width * 0.04,
        y: height * 0.26,
        speed: 0.14,
        w: 220,
        h: 72,
        opacity: 0.95,
        driftY: 4.1,
        variant: 0,
      },
      {
        x: width * 0.68,
        y: height * 0.31,
        speed: 0.11,
        w: 200,
        h: 68,
        opacity: 0.92,
        driftY: 1.9,
        variant: 1,
      },
    ];

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

      ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
      ctx.beginPath();
      if (c.variant === 0) {
        ctx.moveTo(-w * 0.46, h * 0.25);
        ctx.quadraticCurveTo(0, h * 0.28, w * 0.46, h * 0.25);
        ctx.bezierCurveTo(w * 0.53, h * 0.18, w * 0.54, -h * 0.12, w * 0.42, -h * 0.24);
        ctx.bezierCurveTo(w * 0.38, -h * 0.52, w * 0.16, -h * 0.58, w * 0.05, -h * 0.38);
        ctx.bezierCurveTo(-w * 0.04, -h * 0.72, -w * 0.25, -h * 0.68, -w * 0.3, -h * 0.35);
        ctx.bezierCurveTo(-w * 0.44, -h * 0.42, -w * 0.54, -h * 0.12, -w * 0.46, h * 0.25);
      } else if (c.variant === 1) {
        ctx.moveTo(-w * 0.48, h * 0.2);
        ctx.quadraticCurveTo(0, h * 0.22, w * 0.48, h * 0.2);
        ctx.bezierCurveTo(w * 0.55, h * 0.12, w * 0.52, -h * 0.16, w * 0.36, -h * 0.28);
        ctx.bezierCurveTo(w * 0.26, -h * 0.45, w * 0.06, -h * 0.46, -w * 0.06, -h * 0.3);
        ctx.bezierCurveTo(-w * 0.18, -h * 0.55, -w * 0.36, -h * 0.5, -w * 0.42, -h * 0.22);
        ctx.bezierCurveTo(-w * 0.54, -h * 0.12, -w * 0.55, h * 0.12, -w * 0.48, h * 0.2);
      } else {
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

      // Subtle highlights
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

      // Layer 1: Distant Horizon Ridge
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

      // Layer 2: Mid-distance Rolling Hill
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

      // Layer 3: Main Foreground Rolling Slope
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

      // Winding Country Lane / Path
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

      // Upper floor windows
      drawWindow(-houseW * 0.28, houseH * 0.26);
      drawWindow(0, houseH * 0.26);
      drawWindow(houseW * 0.28, houseH * 0.26);

      // Lower floor windows
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

    // Draw Expanding Wind/Acoustic Disturbance Ripples
    const drawRipples = () => {
      ctx.save();
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += 5.5;
        rip.opacity *= 0.94;

        ctx.strokeStyle = `rgba(255, 255, 255, ${rip.opacity * 0.55})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(28, 36, 33, ${rip.opacity * 0.35})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, Math.max(0, rip.radius - 8), 0, Math.PI * 2);
        ctx.stroke();

        if (rip.radius > rip.maxRadius || rip.opacity < 0.02) {
          ripples.splice(i, 1);
        }
      }
      ctx.restore();
    };

    // --------------------------------------------------------------------------------
    // 60FPS REYNOLDS BOIDS SIMULATION & ANIMATION LOOP
    // --------------------------------------------------------------------------------
    const render = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      const pX = (mouseRef.current.x / width - 0.5) * 20;
      const pY = (mouseRef.current.y / height - 0.5) * 12;

      ctx.clearRect(0, 0, width, height);

      // 1. Sky & Golden-Yellow Horizon
      drawSky();

      // 2. Fully White Smooth Clouds
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        cloud.driftY += 0.015;
        if (cloud.x > width + 300) cloud.x = -300;
        drawCloud(cloud, pX);
      });

      // 3. Shockwave Ripples
      drawRipples();

      // 4. Update and Render Craig Reynolds Flying Bird Flock Boids
      // Sort by depth so distant birds are layered behind foreground birds
      const sortedBoids = [...boidsRef.current].sort((a, b) => a.zDepth - b.zDepth);
      sortedBoids.forEach((boid) => {
        boid.update(
          boidsRef.current,
          width,
          height,
          mouseRef.current.x,
          mouseRef.current.y,
          mouseRef.current.hasPointer,
          ripplesRef.current
        );
        boid.draw(ctx);
      });

      // 5. Rolling Green Fields & Winding Path
      const { houseX, houseY } = drawFields(pX, pY);

      // 6. Cottage House (Clean pitched roof, no chimney)
      drawHouse(houseX, houseY);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('shramik-scatter-flock', handleGlobalScatter as EventListener);
    };
  }, [flockSize]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-auto z-0 no-print cursor-crosshair"
      style={{ opacity, width: '100vw', height: '100vh' }}
      aria-label="Artistic landscape with flying bird flock boids simulation"
    />
  );
};

export default BoidsCanvas;
