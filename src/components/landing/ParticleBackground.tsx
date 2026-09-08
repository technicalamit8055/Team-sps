import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  glowColor: string;
  alpha: number;
  originalZ: number;
}

interface GlowingOrb {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Mouse coordinates
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isHovered: false,
    };

    // Color palette - vibrant tricolor & modern tech civic tones
    const colors = [
      { main: '#FF7700', glow: 'rgba(255, 119, 0, 0.6)' },   // Vibrant Saffron
      { main: '#FFA500', glow: 'rgba(255, 165, 0, 0.6)' },   // Bright Amber Gold
      { main: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },  // Indian Emerald Green
      { main: '#00D2FF', glow: 'rgba(0, 210, 255, 0.6)' },   // Electric Cyan
      { main: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)' },  // Royal Navy Blue
      { main: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' },  // Golden Sun
      { main: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.5)' },  // Tech Purple
    ];

    // Ambient floating colorful glowing orbs
    const orbs: GlowingOrb[] = [
      { x: width * 0.15, y: height * 0.25, radius: 180, vx: 0.15, vy: 0.1, color: 'rgba(255, 119, 0, 0.16)', pulseSpeed: 0.02, pulsePhase: 0 },
      { x: width * 0.85, y: height * 0.35, radius: 210, vx: -0.12, vy: -0.15, color: 'rgba(16, 185, 129, 0.14)', pulseSpeed: 0.015, pulsePhase: 2 },
      { x: width * 0.5, y: height * 0.75, radius: 240, vx: 0.1, vy: -0.1, color: 'rgba(59, 130, 246, 0.12)', pulseSpeed: 0.018, pulsePhase: 4 },
      { x: width * 0.7, y: height * 0.15, radius: 150, vx: -0.08, vy: 0.12, color: 'rgba(245, 158, 11, 0.15)', pulseSpeed: 0.025, pulsePhase: 1 },
      { x: width * 0.3, y: height * 0.85, radius: 160, vx: 0.1, vy: 0.08, color: 'rgba(139, 92, 246, 0.12)', pulseSpeed: 0.02, pulsePhase: 3 },
    ];

    // Particles array
    const particles: Particle[] = [];
    const particleCount = Math.min(Math.floor((width * height) / 14000) + 35, 95);

    for (let i = 0; i < particleCount; i++) {
      const colorObj = colors[Math.floor(Math.random() * colors.length)];
      const z = (Math.random() - 0.5) * 400;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        originalZ: z,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        vz: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2.5 + 1.8,
        color: colorObj.main,
        glowColor: colorObj.glow,
        alpha: Math.random() * 0.6 + 0.35,
      });
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.isHovered = true;
    };

    const handleMouseLeave = () => {
      mouse.isHovered = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const fov = 400;

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // 1. Draw glowing background orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.pulsePhase += orb.pulseSpeed;

        if (orb.x < -orb.radius) orb.x = width + orb.radius;
        if (orb.x > width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = height + orb.radius;
        if (orb.y > height + orb.radius) orb.y = -orb.radius;

        const currentRadius = orb.radius * (1 + Math.sin(orb.pulsePhase) * 0.15);
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, currentRadius);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Interactive cursor glow
      if (mouse.isHovered) {
        const cursorGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
        cursorGlow.addColorStop(0, 'rgba(255, 154, 61, 0.16)');
        cursorGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
        cursorGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 160, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Update & Draw Particles with 3D projection
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.z > 200 || p.z < -200) p.vz *= -1;

        // Mouse interaction (repel gently)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140 && dist > 0) {
          const force = (140 - dist) / 140;
          p.x -= (dx / dist) * force * 2.5;
          p.y -= (dy / dist) * force * 2.5;
        }

        // Screen boundary wrap
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // 3D perspective projection
        const scale = fov / (fov + p.z);
        const projRadius = Math.max(p.radius * scale, 1);

        // Draw particle glow
        ctx.save();
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = projRadius * 4;
        ctx.globalAlpha = Math.min(Math.max(p.alpha * scale, 0.2), 0.9);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, projRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 4. Connect nearby particles with glowing gradient lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distLinks = Math.hypot(p.x - p2.x, p.y - p2.y);

          if (distLinks < 130) {
            const lineAlpha = (1 - distLinks / 130) * 0.35 * Math.min(p.alpha, p2.alpha);
            const lineGrad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            lineGrad.addColorStop(0, p.glowColor);
            lineGrad.addColorStop(1, p2.glowColor);

            ctx.save();
            ctx.strokeStyle = lineGrad;
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 1.2 * scale;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-90 transition-opacity duration-700"
      />
      {/* Dynamic colorful gradient mesh overlays */}
      <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/25 to-orange-600/20 blur-3xl pointer-events-none animate-float" />
      <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-gradient-to-bl from-emerald-500/25 to-teal-600/20 blur-3xl pointer-events-none animate-float stagger-2" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-80 rounded-full bg-gradient-to-tr from-blue-600/20 via-indigo-500/15 to-purple-600/15 blur-3xl pointer-events-none" />
    </div>
  );
};

export default ParticleBackground;
