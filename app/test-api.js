const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/GEMINI_API_KEY=(.*)/);
if (!match) { console.error("No key"); process.exit(1); }
const key = match[1].trim().replace(/['"]/g, '');

async function run() {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const d = await r.json();
    if (d.error) {
      console.error("API Error:", d.error);
    } else {
      console.log("AVAILABLE MODELS:");
      d.models.forEach(m => {
        if (m.supportedGenerationMethods.includes("generateContent")) {
          console.log("- " + m.name);
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
}
run();
