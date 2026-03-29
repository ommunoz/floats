/**
 * backend/lib/config.js
 * Utility to safely load JSON data from environment variables or local files.
 * Supports both raw JSON and Base64-encoded strings (for Railway/Vercel).
 */
const fs = require('fs');
const path = require('path');

/**
 * Loads a JSON object with the following priority:
 * 1. Environment variable (key) — accepts raw or base64 JSON
 * 2. Local filesystem (filePath) — absolute path
 * 3. Fallback
 */
function loadJsonData(key, filePath, fallback = {}) {
    // 1. Try Environment Variable (Railway/Vercel priority)
    const val = process.env[key];
    if (val) {
        console.log(`[config.js] Found env var "${key}" (length: ${val.length})`);
        const trimmed = val.trim();
        
        // Remove outer quotes if the platform (Railway/Vercel) wrapped the value
        let cleanVal = trimmed;
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            console.log(`[config.js] Removing outer quotes from "${key}"`);
            cleanVal = trimmed.substring(1, trimmed.length - 1);
        }

        // Detect base64: no starting '{'
        const isBase64 = !cleanVal.startsWith('{');
        
        try {
            // Remove ALL whitespace for base64 strings (handles platform word-wrapping)
            const jsonStr = isBase64 
                ? Buffer.from(cleanVal.replace(/\s/g, ''), 'base64').toString('utf8')
                : cleanVal;
            
            console.log(`[config.js] Successfully parsed JSON for "${key}" (isBase64: ${isBase64})`);
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error(`❌ Failed to parse JSON from env var "${key}":`, e.message);
            if (isBase64) {
              try {
                // Peek at the beginning of the problematic string
                console.log(`[config.js] Problematic raw string peek: ${cleanVal.substring(0, 20)}...`);
              } catch (inner) {}
            }
        }
    }

    // 2. Try Local Filesystem
    if (filePath && fs.existsSync(filePath)) {
        console.log(`[config.js] Env var "${key}" not found, trying file: ${filePath}`);
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        } catch (e) {
            console.error(`❌ Failed to parse JSON from file "${filePath}":`, e.message);
        }
    }

    return fallback;
}

module.exports = { loadJsonData };
