import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    // Создаем 20 белых воздушных фигур
    const circles = Array.from({ length: 20 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 200 + 100, 
      dx: (Math.random() - 0.5) * 0.4,  
      dy: (Math.random() - 0.5) * 0.4,   
      color: 'rgba(52, 211, 153, 0.3)' 
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      circles.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();

        c.x += c.dx;
        c.y += c.dy;

        // Плавное перетекание за края экрана
        if (c.x + c.radius < 0) c.x = width + c.radius;
        if (c.x - c.radius > width) c.x = -c.radius;
        if (c.y + c.radius < 0) c.y = height + c.radius;
        if (c.y - c.radius > height) c.y = -c.radius;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-0 pointer-events-none"
      style={{ 
        filter: 'blur(30px)', 
        backgroundColor: '#ebfdf3' 
      }} 
    />
  );
}