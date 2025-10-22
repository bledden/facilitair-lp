// FACILITAIR Background Animations
// Liquid Blob Physics (Desktop) and Network Packets (Mobile/Low-Perf)

class LiquidBlobAnimation {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.blobs = [];
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.targetMouseX = this.mouseX;
        this.targetMouseY = this.mouseY;
        this.animationId = null;
        this.isMouseOver = false;

        this.init();
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.container.appendChild(this.canvas);

        // Create 10-12 blobs with varied dark colors - teal, red, yellow, green, orange, purple
        const blobCount = 10 + Math.floor(Math.random() * 3);
        const colors = [
            // Teals
            { r: 10, g: 60, b: 75, a: 0.4 },     // Very dark teal
            { r: 12, g: 70, b: 85, a: 0.38 },    // Very dark teal 2
            { r: 15, g: 80, b: 95, a: 0.36 },    // Dark teal
            // Reds
            { r: 80, g: 20, b: 30, a: 0.38 },    // Dark red
            { r: 90, g: 25, b: 35, a: 0.36 },    // Dark red 2
            // Yellows
            { r: 90, g: 80, b: 20, a: 0.35 },    // Dark yellow/gold
            { r: 100, g: 85, b: 25, a: 0.37 },   // Dark yellow 2
            // Greens
            { r: 20, g: 70, b: 40, a: 0.38 },    // Dark green
            { r: 25, g: 80, b: 45, a: 0.36 },    // Dark green 2
            // Oranges
            { r: 100, g: 50, b: 20, a: 0.37 },   // Dark orange
            { r: 110, g: 55, b: 25, a: 0.35 },   // Dark orange 2
            // Purples
            { r: 60, g: 30, b: 80, a: 0.38 },    // Dark purple
            { r: 70, g: 35, b: 90, a: 0.36 },    // Dark purple 2
        ];

        for (let i = 0; i < blobCount; i++) {
            const color = colors[i % colors.length];
            this.blobs.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                radius: 80 + Math.random() * 60, // Much smaller, tighter blobs
                baseRadius: 80 + Math.random() * 60,
                color: color,
                vertices: this.generateBlobVertices(20), // Fewer vertices for more organic shape
                phase: Math.random() * Math.PI * 2,
                targetX: null,
                targetY: null
            });
        }

        // Mouse tracking with hover detection
        document.addEventListener('mousemove', (e) => {
            this.targetMouseX = e.clientX;
            this.targetMouseY = e.clientY;
            this.isMouseOver = true;
        });

        document.addEventListener('mouseleave', () => {
            this.isMouseOver = false;
        });

        // Resize handling
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });

        this.animate();
    }

    generateBlobVertices(count) {
        const vertices = [];
        for (let i = 0; i < count; i++) {
            vertices.push({
                angle: (Math.PI * 2 / count) * i,
                offset: 0.9 + Math.random() * 0.1,
                speed: 0.002 + Math.random() * 0.003
            });
        }
        return vertices;
    }

    drawBlob(blob, time) {
        this.ctx.beginPath();

        // Slower, smoother sinusoidal animation for viscous liquid effect
        blob.phase += 0.0015;

        const points = [];
        blob.vertices.forEach((vertex, i) => {
            // Gentle wave-like offset changes for viscosity
            const wave = Math.sin(blob.phase + vertex.angle * 1.5) * 0.05;
            vertex.offset = 0.95 + wave;

            const x = blob.x + Math.cos(vertex.angle) * blob.radius * vertex.offset;
            const y = blob.y + Math.sin(vertex.angle) * blob.radius * vertex.offset;
            points.push({ x, y });
        });

        // Draw smooth blob using bezier curves
        if (points.length > 0) {
            this.ctx.moveTo(points[0].x, points[0].y);

            for (let i = 0; i < points.length; i++) {
                const current = points[i];
                const next = points[(i + 1) % points.length];
                const nextNext = points[(i + 2) % points.length];

                const cp1x = current.x + (next.x - current.x) * 0.5;
                const cp1y = current.y + (next.y - current.y) * 0.5;
                const cp2x = next.x + (nextNext.x - next.x) * 0.5;
                const cp2y = next.y + (nextNext.y - next.y) * 0.5;

                this.ctx.bezierCurveTo(cp1x, cp1y, next.x, next.y, cp2x, cp2y);
            }
        }

        this.ctx.closePath();

        // Create gradient for depth
        const gradient = this.ctx.createRadialGradient(
            blob.x, blob.y, 0,
            blob.x, blob.y, blob.radius
        );
        gradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${blob.color.a * 1.2})`);
        gradient.addColorStop(0.6, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${blob.color.a})`);
        gradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${blob.color.a * 0.3})`);

        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Add glow
        this.ctx.shadowBlur = 40;
        this.ctx.shadowColor = `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.5)`;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    updateBlobs() {
        // Faster mouse tracking for more responsive chase
        if (this.isMouseOver) {
            this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
            this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;
        }

        this.blobs.forEach(blob => {
            // Stronger mouse attraction when hovering
            if (this.isMouseOver) {
                const dx = this.mouseX - blob.x;
                const dy = this.mouseY - blob.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 600 && distance > 0) {
                    const force = (600 - distance) / 600 * 0.12; // Much stronger force
                    blob.vx += (dx / distance) * force;
                    blob.vy += (dy / distance) * force;
                }
            }

            // Random drift for lava lamp effect
            blob.vx += (Math.random() - 0.5) * 0.02;
            blob.vy += (Math.random() - 0.5) * 0.02;

            // Update position
            blob.x += blob.vx;
            blob.y += blob.vy;

            // Stronger damping for viscous, syrupy movement
            blob.vx *= 0.96;
            blob.vy *= 0.96;

            // Wrapping at edges
            if (blob.x < -blob.radius) blob.x = this.canvas.width + blob.radius;
            if (blob.x > this.canvas.width + blob.radius) blob.x = -blob.radius;
            if (blob.y < -blob.radius) blob.y = this.canvas.height + blob.radius;
            if (blob.y > this.canvas.height + blob.radius) blob.y = -blob.radius;

            // Very gentle blob-to-blob interaction - allow heavy overlap for color mixing
            this.blobs.forEach(other => {
                if (blob === other) return;

                const dx = other.x - blob.x;
                const dy = other.y - blob.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = (blob.radius + other.radius) * 0.5; // Allow 50% overlap

                if (dist < minDist && dist > 0) {
                    const force = (minDist - dist) / dist * 0.01; // Very gentle
                    blob.vx -= (dx * force);
                    blob.vy -= (dy * force);
                }
            });
        });
    }

    animate() {
        // Create metaball effect using image data manipulation
        const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        const data = imageData.data;

        this.updateBlobs();

        // Calculate metaball field for each pixel
        for (let y = 0; y < this.canvas.height; y += 2) { // Skip every other pixel for performance
            for (let x = 0; x < this.canvas.width; x += 2) {
                let sum = 0;
                let colorR = 0, colorG = 0, colorB = 0, totalWeight = 0;

                // Calculate influence from each blob
                this.blobs.forEach(blob => {
                    const dx = x - blob.x;
                    const dy = y - blob.y;
                    const distSq = dx * dx + dy * dy;
                    const radiusSq = blob.radius * blob.radius;

                    if (distSq < radiusSq * 4) { // Only calculate if within influence range
                        const influence = radiusSq / (distSq + 1);
                        sum += influence;

                        // Weight color contribution by influence
                        const weight = influence;
                        colorR += blob.color.r * weight;
                        colorG += blob.color.g * weight;
                        colorB += blob.color.b * weight;
                        totalWeight += weight;
                    }
                });

                // Much higher metaball threshold for tight, defined shapes
                if (sum > 1.5) {
                    const idx = (y * this.canvas.width + x) * 4;
                    const idx2 = ((y + 1) * this.canvas.width + x) * 4;
                    const idx3 = (y * this.canvas.width + (x + 1)) * 4;
                    const idx4 = ((y + 1) * this.canvas.width + (x + 1)) * 4;

                    // Average colors based on blob influences
                    const r = totalWeight > 0 ? colorR / totalWeight : 0;
                    const g = totalWeight > 0 ? colorG / totalWeight : 0;
                    const b = totalWeight > 0 ? colorB / totalWeight : 0;
                    const a = Math.min(255, sum * 60);

                    // Fill 2x2 block for performance
                    [idx, idx2, idx3, idx4].forEach(i => {
                        if (i >= 0 && i < data.length) {
                            data[i] = r;
                            data[i + 1] = g;
                            data[i + 2] = b;
                            data[i + 3] = a;
                        }
                    });
                }
            }
        }

        // Clear and draw
        this.ctx.fillStyle = '#100F0D';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.putImageData(imageData, 0, 0);

        // Minimal blur for crisp, defined shapes
        this.ctx.filter = 'blur(3px)';
        this.ctx.drawImage(this.canvas, 0, 0);
        this.ctx.filter = 'none';

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

class NetworkPacketAnimation {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.packets = [];
        this.animationId = null;

        this.init();
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.container.appendChild(this.canvas);

        // Create network nodes
        const nodeCount = 8 + Math.floor(Math.random() * 4);
        const colors = [
            'rgba(92, 225, 230, 0.6)',    // Teal
            'rgba(45, 212, 191, 0.6)',    // Lighter teal
            'rgba(14, 116, 144, 0.6)',    // Dark teal
        ];

        for (let i = 0; i < nodeCount; i++) {
            this.nodes.push({
                x: (Math.random() * 0.8 + 0.1) * this.canvas.width,
                y: (Math.random() * 0.8 + 0.1) * this.canvas.height,
                radius: 8 + Math.random() * 4,
                color: colors[i % colors.length],
                pulsePhase: Math.random() * Math.PI * 2
            });
        }

        // Resize handling
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });

        this.animate();
    }

    createPacket() {
        if (this.packets.length > 20) return; // Limit packets

        const fromNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
        const toNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];

        if (fromNode === toNode) return;

        this.packets.push({
            from: fromNode,
            to: toNode,
            progress: 0,
            speed: 0.005 + Math.random() * 0.01,
            color: fromNode.color
        });
    }

    drawNodes() {
        this.nodes.forEach(node => {
            // Pulsing effect
            node.pulsePhase += 0.02;
            const pulse = Math.sin(node.pulsePhase) * 0.3 + 1;

            // Draw node
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
            this.ctx.fillStyle = node.color;
            this.ctx.fill();

            // Glow
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = node.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Draw connections to nearby nodes
            this.nodes.forEach(other => {
                if (node === other) return;

                const dx = other.x - node.x;
                const dy = other.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 300) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(node.x, node.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.strokeStyle = `rgba(92, 225, 230, ${0.1 * (1 - dist / 300)})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            });
        });
    }

    drawPackets() {
        this.packets = this.packets.filter(packet => {
            packet.progress += packet.speed;

            if (packet.progress >= 1) {
                return false; // Remove completed packets
            }

            // Interpolate position
            const x = packet.from.x + (packet.to.x - packet.from.x) * packet.progress;
            const y = packet.from.y + (packet.to.y - packet.from.y) * packet.progress;

            // Draw packet
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = packet.color;
            this.ctx.fill();

            // Trail effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = packet.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            return true;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawNodes();
        this.drawPackets();

        // Randomly create packets
        if (Math.random() < 0.05) {
            this.createPacket();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize animation based on performance
let currentAnimation = null;

window.addEventListener('performance-detected', (event) => {
    const { animationType } = event.detail;
    const container = document.getElementById('bg-animation');

    if (animationType === 'liquid') {
        container.classList.add('liquid-blobs');
        currentAnimation = new LiquidBlobAnimation(container);
    } else if (animationType === 'network') {
        container.classList.add('network-packets');
        currentAnimation = new NetworkPacketAnimation(container);
    }
    // If 'none', no animation is created
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (currentAnimation && currentAnimation.destroy) {
        currentAnimation.destroy();
    }
});
