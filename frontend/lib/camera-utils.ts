/**
 * Camera utilities for auto-capture functionality.
 * Detects when an insurance card is stable and in focus to automatically capture.
 */

interface FrameAnalysis {
    sharpness: number;
    brightness: number;
    hasCardShape: boolean;
}

/**
 * Calculates the sharpness of an image using Laplacian variance.
 * Higher values indicate sharper images.
 */
function calculateSharpness(imageData: ImageData): number {
    const { data, width, height } = imageData;

    // Convert to grayscale and calculate Laplacian
    const gray: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
        gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    // Apply Laplacian kernel [0, 1, 0], [1, -4, 1], [0, 1, 0]
    let variance = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const laplacian =
                gray[idx - width] +
                gray[idx - 1] +
                gray[idx + 1] +
                gray[idx + width] -
                4 * gray[idx];
            variance += laplacian * laplacian;
            count++;
        }
    }

    return count > 0 ? variance / count : 0;
}

/**
 * Calculates average brightness of the image (0-255).
 */
function calculateBrightness(imageData: ImageData): number {
    const { data } = imageData;
    let sum = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    return sum / pixelCount;
}

/**
 * Simple edge detection to check if there's a card-like rectangular shape.
 * Uses horizontal and vertical edge detection in the center region.
 */
function detectCardShape(imageData: ImageData): boolean {
    const { data, width, height } = imageData;

    // Check the center region for edge content
    const marginX = Math.floor(width * 0.15);
    const marginY = Math.floor(height * 0.15);

    let edgeCount = 0;
    const threshold = 30;

    // Sample points along expected card borders
    for (let y = marginY; y < height - marginY; y += 10) {
        for (let x = marginX; x < width - marginX; x += 10) {
            const idx = (y * width + x) * 4;
            const idxRight = (y * width + Math.min(x + 1, width - 1)) * 4;
            const idxDown = (Math.min(y + 1, height - 1) * width + x) * 4;

            const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            const grayRight = 0.299 * data[idxRight] + 0.587 * data[idxRight + 1] + 0.114 * data[idxRight + 2];
            const grayDown = 0.299 * data[idxDown] + 0.587 * data[idxDown + 1] + 0.114 * data[idxDown + 2];

            if (Math.abs(gray - grayRight) > threshold || Math.abs(gray - grayDown) > threshold) {
                edgeCount++;
            }
        }
    }

    // Expect some edges from text/logos on the card
    return edgeCount > 50;
}

/**
 * Analyzes a single video frame.
 */
export function analyzeFrame(canvas: HTMLCanvasElement): FrameAnalysis {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return { sharpness: 0, brightness: 0, hasCardShape: false };
    }

    // Sample a smaller region for performance
    const sampleWidth = Math.min(320, canvas.width);
    const sampleHeight = Math.min(180, canvas.height);
    const offsetX = Math.floor((canvas.width - sampleWidth) / 2);
    const offsetY = Math.floor((canvas.height - sampleHeight) / 2);

    const imageData = ctx.getImageData(offsetX, offsetY, sampleWidth, sampleHeight);

    return {
        sharpness: calculateSharpness(imageData),
        brightness: calculateBrightness(imageData),
        hasCardShape: detectCardShape(imageData),
    };
}

interface StabilityState {
    frameHistory: FrameAnalysis[];
    lastCaptureTime: number;
}

/**
 * Creates a frame stability detector for auto-capture.
 */
export function createStabilityDetector() {
    const state: StabilityState = {
        frameHistory: [],
        lastCaptureTime: 0,
    };

    const HISTORY_SIZE = 5; // Reduced for faster capture
    const MIN_SHARPNESS = 80; // Slightly more lenient
    const MIN_BRIGHTNESS = 40;
    const MAX_BRIGHTNESS = 220;
    const STABILITY_THRESHOLD = 0.12; // 12% variance for better stability
    const CAPTURE_COOLDOWN = 2000; // 2 seconds between captures

    return {
        /**
         * Adds a new frame analysis and returns whether auto-capture should trigger.
         */
        addFrame(analysis: FrameAnalysis): boolean {
            const now = Date.now();

            // Cooldown check
            if (now - state.lastCaptureTime < CAPTURE_COOLDOWN) {
                return false;
            }

            state.frameHistory.push(analysis);
            if (state.frameHistory.length > HISTORY_SIZE) {
                state.frameHistory.shift();
            }

            // Need enough history
            if (state.frameHistory.length < HISTORY_SIZE) {
                return false;
            }

            // Check current frame quality
            if (analysis.sharpness < MIN_SHARPNESS) {
                return false;
            }

            if (analysis.brightness < MIN_BRIGHTNESS || analysis.brightness > MAX_BRIGHTNESS) {
                return false;
            }

            if (!analysis.hasCardShape) {
                return false;
            }

            // Check stability (low variance in sharpness across frames)
            const sharpnessValues = state.frameHistory.map(f => f.sharpness);
            const avgSharpness = sharpnessValues.reduce((a, b) => a + b, 0) / sharpnessValues.length;
            const variance = sharpnessValues.reduce((sum, v) => sum + Math.pow(v - avgSharpness, 2), 0) / sharpnessValues.length;
            const normalizedVariance = Math.sqrt(variance) / avgSharpness;

            if (normalizedVariance > STABILITY_THRESHOLD) {
                return false;
            }

            // All checks passed - trigger capture
            state.lastCaptureTime = now;
            return true;
        },

        /**
         * Resets the detector state.
         */
        reset() {
            state.frameHistory = [];
            state.lastCaptureTime = 0;
        },

        /**
         * Gets the current quality score (0-100) for UI feedback.
         */
        getQualityScore(analysis: FrameAnalysis): number {
            let score = 0;

            // Sharpness contributes 40 points
            const sharpnessScore = Math.min(40, (analysis.sharpness / MIN_SHARPNESS) * 40);
            score += sharpnessScore;

            // Brightness contributes 30 points (optimal around 128)
            const brightnessDiff = Math.abs(analysis.brightness - 128);
            const brightnessScore = Math.max(0, 30 - (brightnessDiff / 128) * 30);
            score += brightnessScore;

            // Card shape contributes 30 points
            if (analysis.hasCardShape) {
                score += 30;
            }

            return Math.round(Math.min(100, score));
        },

        /**
         * Gets stability progress (0-100) showing how close to auto-capture.
         */
        getStabilityProgress(): number {
            if (state.frameHistory.length === 0) return 0;

            const progress = (state.frameHistory.length / HISTORY_SIZE) * 100;
            return Math.round(Math.min(100, progress));
        },
    };
}
