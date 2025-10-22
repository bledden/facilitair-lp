// Performance Detection System
// Determines device capability and selects appropriate animation

class PerformanceDetector {
    constructor() {
        this.score = 0;
        this.canAnimate = false;
        this.animationType = 'none';
    }

    async detect() {
        // Check for mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Check screen size
        const isSmallScreen = window.innerWidth < 768;

        // Check for GPU
        const hasGoodGPU = this.testGPU();

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Calculate performance score
        let score = 100;

        if (isMobile) score -= 30;
        if (isSmallScreen) score -= 20;
        if (!hasGoodGPU) score -= 40;
        if (prefersReducedMotion) score = 0;

        // Check memory (if available)
        if (performance.memory) {
            const memoryRatio = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
            if (memoryRatio > 0.9) score -= 20;
        }

        // FPS test
        const fps = await this.measureFPS();
        if (fps < 30) score -= 30;
        else if (fps < 45) score -= 15;

        this.score = Math.max(0, score);

        // Determine animation type
        if (prefersReducedMotion || this.score < 20) {
            this.animationType = 'none';
            this.canAnimate = false;
        } else if (this.score >= 60 && !isMobile && !isSmallScreen) {
            this.animationType = 'liquid';
            this.canAnimate = true;
        } else {
            this.animationType = 'network';
            this.canAnimate = true;
        }

        console.log(`Performance Score: ${this.score}, Animation Type: ${this.animationType}`);

        return {
            score: this.score,
            canAnimate: this.canAnimate,
            animationType: this.animationType
        };
    }

    testGPU() {
        try {
            const canvas = document.getElementById('perf-test');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return false;

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                // Basic check for integrated vs dedicated GPU
                return !renderer.toLowerCase().includes('intel');
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    measureFPS() {
        return new Promise((resolve) => {
            let frames = 0;
            const startTime = performance.now();
            const duration = 1000; // 1 second test

            const countFrames = () => {
                frames++;
                if (performance.now() - startTime < duration) {
                    requestAnimationFrame(countFrames);
                } else {
                    const fps = frames;
                    resolve(fps);
                }
            };

            requestAnimationFrame(countFrames);
        });
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    const detector = new PerformanceDetector();
    const result = await detector.detect();

    // Store result globally
    window.FACILITAIR_PERF = result;

    // Enable logo spinning if capable
    if (result.canAnimate && result.score >= 50) {
        document.body.classList.add('can-animate');
    }

    // Dispatch event for animation system
    window.dispatchEvent(new CustomEvent('performance-detected', { detail: result }));
});
