// lib/utils/fetch-image.js
/**
 * Shared image downloader (URL -> base64)
 * Used by Exam/Test (image-intelligence) to ensure OCR receives raw bytes
 * Updated: 2025-08-27 13:58:00 UTC
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

function downloadImageAsBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(imageUrl);
      const client = parsed.protocol === "http:" ? http : https;

      const req = client.request(
        parsed,
        {
          method: "GET",
          headers: {
            "User-Agent":
              "GOATBot/2.0 (+https://github.com/MankweAI/goat_edtech)",
            Accept: "image/*",
          },
          timeout: 10000,
        },
        (res) => {
          if ((res.statusCode || 0) >= 400) {
            return reject(
              new Error(`HTTP ${res.statusCode} fetching image URL`)
            );
          }

          const contentType = res.headers["content-type"] || "";
          if (!contentType.startsWith("image/")) {
            return reject(
              new Error(
                `URL did not return an image content-type: ${contentType}`
              )
            );
          }

          const MAX = 5 * 1024 * 1024; // 5MB
          const chunks = [];
          let total = 0;

          res.on("data", (chunk) => {
            total += chunk.length;
            if (total > MAX) {
              req.destroy(new Error("Image too large (max 5MB)"));
              return;
            }
            chunks.push(chunk);
          });

          res.on("end", () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer.toString("base64"));
          });
        }
      );

      req.on("timeout", () => req.destroy(new Error("Image download timeout")));
      req.on("error", (err) => reject(err));
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { downloadImageAsBase64 };
