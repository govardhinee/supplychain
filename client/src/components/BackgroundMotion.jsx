import { useEffect, useRef } from 'react';

const BackgroundMotion = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = window.innerWidth;
        let height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', resize);

        // Floating interconnected nodes
        const particleCount = Math.min(Math.floor((width * height) / 12000), 100);
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 2 + 1
            });
        }

        // Cube drawing helper
        const drawCube = (x, y, size, opacity) => {
            ctx.beginPath();
            ctx.moveTo(x, y - size); // top
            ctx.lineTo(x + size * 0.866, y - size * 0.5); // top right
            ctx.lineTo(x + size * 0.866, y + size * 0.5); // bottom right
            ctx.lineTo(x, y + size); // bottom
            ctx.lineTo(x - size * 0.866, y + size * 0.5); // bottom left
            ctx.lineTo(x - size * 0.866, y - size * 0.5); // top left
            ctx.closePath();
            ctx.fillStyle = `rgba(0, 229, 255, ${opacity * 0.1})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Inner lines for 3D effect
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + size);
            ctx.moveTo(x, y);
            ctx.lineTo(x - size * 0.866, y - size * 0.5);
            ctx.moveTo(x, y);
            ctx.lineTo(x + size * 0.866, y - size * 0.5);
            ctx.stroke();
        };

        const draw = () => {
            // Dark trail effect for smooth motion
            ctx.fillStyle = 'rgba(7, 11, 25, 0.2)';
            ctx.fillRect(0, 0, width, height);

            // Draw glowing background ambient lights
            const gradient1 = ctx.createRadialGradient(width * 0.2, height * 0.3, 0, width * 0.2, height * 0.3, width * 0.4);
            gradient1.addColorStop(0, 'rgba(0, 229, 255, 0.03)');
            gradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');

            const gradient2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 0, width * 0.8, height * 0.7, width * 0.4);
            gradient2.addColorStop(0, 'rgba(58, 134, 255, 0.03)');
            gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient1;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = gradient2;
            ctx.fillRect(0, 0, width, height);

            // Update and draw particles / cubes
            for (let i = 0; i < particleCount; i++) {
                let p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges with damping
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Alternate between drawing simple nodes and small 3D cubes
                if (i % 4 === 0) {
                    drawCube(p.x, p.y, p.radius * 3, 0.5);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(58, 134, 255, 0.8)';
                    ctx.fill();
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#00E5FF';
                }
                ctx.shadowBlur = 0; // reset shadow for lines

                // Draw network lines
                for (let j = i + 1; j < particleCount; j++) {
                    let p2 = particles[j];
                    let dx = p.x - p2.x;
                    let dy = p.y - p2.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 * (1 - dist / 150)})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                background: '#070B19',
                pointerEvents: 'none', // Allow clicks to pass through
            }}
        />
    );
};

export default BackgroundMotion;
