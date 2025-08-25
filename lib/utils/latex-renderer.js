/**
 * LaTeX Rendering Service
 * GOAT Bot 2.0
 * Created: 2025-08-25 11:06:31 UTC
 * Developer: DithetoMokgabudi
 */

const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

// Use node-canvas as a fallback if MathJax-node is not available
let canvas;
try {
  canvas = require("canvas");
} catch (e) {
  console.log("⚠️ node-canvas not available, using simplified fallback");
}

// Try to use mathjax-node if available
let mjAPI;
try {
  mjAPI = require("mathjax-node");
  mjAPI.config({
    MathJax: {
      SVG: {
        font: "TeX",
      },
    },
  });
  mjAPI.start();
  console.log("✅ MathJax initialized");
} catch (e) {
  console.log("⚠️ MathJax not available, will use alternative rendering");
}

// Cache rendered images to avoid regenerating the same content
const imageCache = new Map();
const MAX_CACHE_SIZE = 200; // Maximum number of cached images
const CACHE_DIR = path.join(process.cwd(), "tmp", "latex-cache");

// Ensure cache directory exists
async function ensureCacheDirectory() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") {
      console.error("❌ Failed to create LaTeX cache directory:", err);
    }
  }
}

// Initialize cache directory
ensureCacheDirectory();

/**
 * Generate a hash for a LaTeX expression
 * @param {string} latex - LaTeX expression
 * @returns {string} - Hash of the expression
 */
function hashLatex(latex, options = {}) {
  const content = JSON.stringify({ latex, options });
  return crypto.createHash("md5").update(content).digest("hex");
}

/**
 * Render LaTeX expression as image using MathJax
 * @param {string} latex - LaTeX expression
 * @param {object} options - Rendering options
 * @returns {Promise<string>} - Base64 encoded image
 */
async function renderWithMathJax(latex, options = {}) {
  if (!mjAPI) {
    throw new Error("MathJax not available");
  }

  try {
    const result = await mjAPI.typeset({
      math: latex,
      format: options.inline ? "inline-TeX" : "TeX",
      svg: true,
      svgPreferences: {
        minWidth: options.minWidth || 720,
        ex: options.ex || 8,
        useGlobalCache: false,
      },
      useGlobalCache: false,
    });

    // Convert SVG to PNG using sharp or canvas if needed
    // For now, return the SVG directly
    return {
      data: result.svg,
      format: "svg",
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("❌ MathJax rendering error:", error);
    throw error;
  }
}

/**
 * Fallback renderer using node-canvas
 * @param {string} latex - LaTeX expression
 * @param {object} options - Rendering options
 * @returns {Promise<string>} - Base64 encoded image
 */
async function renderWithCanvas(latex, options = {}) {
  if (!canvas) {
    throw new Error("node-canvas not available");
  }

  // Very basic rendering - just text representation
  const width = options.width || 800;
  const height = options.height || 400;
  const canvasObj = canvas.createCanvas(width, height);
  const ctx = canvasObj.getContext("2d");

  // Fill background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Draw LaTeX as text (simplified)
  ctx.fillStyle = "#000000";
  ctx.font = "20px monospace";

  // Format the LaTeX nicely
  const formattedLatex = latex
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ");

  ctx.fillText(
    `LaTeX: ${formattedLatex.substring(0, 50)}${
      formattedLatex.length > 50 ? "..." : ""
    }`,
    20,
    30
  );
  ctx.fillText("(Simplified rendering - MathJax unavailable)", 20, 60);

  return {
    data: canvasObj.toDataURL("image/png").split(",")[1],
    format: "png",
    width,
    height,
  };
}

/**
 * Check if content is complex and needs LaTeX rendering
 * @param {string} text - Content to check
 * @returns {boolean} - True if content needs LaTeX
 */
function needsLatexRendering(text) {
  if (!text) return false;

  // Define patterns that indicate complex math
  const complexPatterns = [
    /\\\[.*?\\\]/s, // Display math mode: \[ ... \]
    /\\\(.*?\\\)/s, // Inline math mode: \( ... \)
    /\$\$.*?\$\$/s, // Display math mode: $$ ... $$
    /\$.*?\$/g, // Inline math mode: $ ... $
    /\\begin\{(equation|align|matrix|pmatrix|bmatrix|cases|array)/, // LaTeX environments
    /\\frac\{.*?\}\{.*?\}/, // Fractions: \frac{}{}
    /\\sqrt\{.*?\}/, // Square roots: \sqrt{}
    /\\int/, // Integrals
    /\\sum/, // Summations
    /\\lim/, // Limits
    /\\left|\\right/, // Delimiters
    /\^{[^}]+}/, // Complex superscripts
    /_{[^}]+}/, // Complex subscripts
    /\\overline\{.*?\}/, // Overlines
    /\\underline\{.*?\}/, // Underlines
    /\\vec\{.*?\}/, // Vectors
    /\\hat\{.*?\}/, // Hats
    /\\cdot/, // Multiplication dot
    /\\times/, // Multiplication times
    /\\div/, // Division
    /\\sin|\\cos|\\tan|\\log/, // Common functions
    /\\\\/, // Newlines in arrays
    /&=/, // Alignment in equations
    /\\alpha|\\beta|\\gamma|\\theta|\\pi/, // Greek letters
  ];

  return complexPatterns.some((pattern) => pattern.test(text));
}

/**
 * Wrap content in LaTeX document
 * @param {string} content - Content to wrap
 * @param {boolean} isEquation - Whether content is a standalone equation
 * @returns {string} - LaTeX document
 */
function wrapInLatexDocument(content, isEquation = true) {
  if (isEquation) {
    // For standalone equations, make sure they're in display mode
    if (!content.startsWith("\\[") && !content.startsWith("$$")) {
      content = `\\[${content}\\]`;
    }
  }

  return `\\documentclass[12pt]{article}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.5in]{geometry}
\\pagestyle{empty}
\\begin{document}
${content}
\\end{document}`;
}

/**
 * Extract LaTeX expressions from text
 * @param {string} text - Text containing LaTeX expressions
 * @returns {Array} - Array of LaTeX expressions
 */
function extractLatexExpressions(text) {
  if (!text) return [];

  const expressions = [];

  // Match display math: $$ ... $$ or \[ ... \]
  const displayMathRegex = /(\$\$(.*?)\$\$)|(\\\[(.*?)\\\])/gs;
  let displayMatch;
  while ((displayMatch = displayMathRegex.exec(text)) !== null) {
    expressions.push({
      full: displayMatch[0],
      content: displayMatch[2] || displayMatch[4],
      type: "display",
    });
  }

  // Match inline math: $ ... $ or \( ... \)
  const inlineMathRegex = /(\$((?!\$).*?)\$)|(\\\((.*?)\\\))/gs;
  let inlineMatch;
  while ((inlineMatch = inlineMathRegex.exec(text)) !== null) {
    expressions.push({
      full: inlineMatch[0],
      content: inlineMatch[2] || inlineMatch[4],
      type: "inline",
    });
  }

  // Match LaTeX environments
  const envRegex = /\\begin\{([^}]+)\}(.*?)\\end\{\1\}/gs;
  let envMatch;
  while ((envMatch = envRegex.exec(text)) !== null) {
    expressions.push({
      full: envMatch[0],
      content: envMatch[0],
      type: "environment",
      env: envMatch[1],
    });
  }

  return expressions;
}

/**
 * Main function to render LaTeX as image
 * @param {string} latex - LaTeX expression or content with LaTeX
 * @param {object} options - Rendering options
 * @returns {Promise<object>} - Rendered image data
 */
async function renderLatexImage(latex, options = {}) {
  // Skip if empty
  if (!latex) {
    throw new Error("No LaTeX content provided");
  }

  // Generate a cache key
  const cacheKey = hashLatex(latex, options);

  // Check cache first
  if (imageCache.has(cacheKey)) {
    console.log(`🔄 Using cached LaTeX image: ${cacheKey.substring(0, 8)}`);
    return imageCache.get(cacheKey);
  }

  try {
    // Try MathJax first
    let result;
    if (mjAPI) {
      result = await renderWithMathJax(latex, options);
    } else if (canvas) {
      result = await renderWithCanvas(latex, options);
    } else {
      throw new Error("No rendering engine available");
    }

    // Cache the result
    if (imageCache.size >= MAX_CACHE_SIZE) {
      // Clear oldest entry
      const firstKey = imageCache.keys().next().value;
      imageCache.delete(firstKey);
    }
    imageCache.set(cacheKey, result);

    // Also save to file cache
    try {
      const cacheFile = path.join(CACHE_DIR, `${cacheKey}.${result.format}`);
      await fs.writeFile(
        cacheFile,
        result.data,
        result.format === "svg" ? "utf8" : "base64"
      );
    } catch (err) {
      console.error("❌ Failed to save LaTeX to cache file:", err);
      // Non-fatal, continue
    }

    return result;
  } catch (error) {
    console.error("❌ LaTeX rendering error:", error);
    throw error;
  }
}

/**
 * Generate a composite image with multiple LaTeX expressions
 * @param {string} text - Text with LaTeX expressions
 * @param {object} options - Rendering options
 * @returns {Promise<object>} - Object with extracted data
 */
async function processTextWithLatex(text, options = {}) {
  if (!needsLatexRendering(text)) {
    return {
      needsRendering: false,
      text,
      hasComplexContent: false,
    };
  }

  // Extract LaTeX expressions
  const expressions = extractLatexExpressions(text);
  if (expressions.length === 0) {
    return {
      needsRendering: false,
      text,
      hasComplexContent: false,
    };
  }

  // For now, just render the first expression as a proof of concept
  // In a full implementation, we'd render each expression and compose them
  const mainExpression = expressions[0];

  try {
    const rendered = await renderLatexImage(mainExpression.content, {
      inline: mainExpression.type === "inline",
      ...options,
    });

    return {
      needsRendering: true,
      text: text.replace(
        mainExpression.full,
        "[Complex mathematical expression]"
      ),
      image: rendered,
      hasComplexContent: true,
    };
  } catch (error) {
    console.error("❌ Failed to process text with LaTeX:", error);
    return {
      needsRendering: false,
      text,
      hasComplexContent: true,
      error: error.message,
    };
  }
}

module.exports = {
  renderLatexImage,
  needsLatexRendering,
  processTextWithLatex,
  extractLatexExpressions,
  wrapInLatexDocument,
};

