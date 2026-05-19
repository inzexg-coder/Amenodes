import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodesDir = path.join(__dirname, '../src/nodes');
const manifestPath = path.join(nodesDir, 'manifest.js');
const translationsPath = path.join(nodesDir, 'translations.js');

const files = fs.readdirSync(nodesDir).filter(f => 
  f.endsWith('.js') && 
  f !== 'index.js' && 
  f !== 'manifest.js' && 
  f !== 'translations.js'
);

const imports = [];
const entries = [];
const enTranslations = {};
const ruTranslations = {};

for (const file of files) {
  const filePath = path.join(nodesDir, file);
  
  try {
    const module = await import(`file://${filePath}`);
    const metadata = module.metadata;
    
    if (metadata && metadata.type) {
      const className = metadata.type;
      imports.push(`import { ${className} as ${className}Ctor, metadata as ${className}Meta } from './${file}';`);
      entries.push(`  { ctor: ${className}Ctor, metadata: ${className}Meta }`);
      
      const enPath = path.join(nodesDir, `locales/en/${className}.js`);
      const ruPath = path.join(nodesDir, `locales/ru/${className}.js`);
      
      if (fs.existsSync(enPath)) {
        const enModule = await import(`file://${enPath}`);
        Object.assign(enTranslations, enModule.default);
      }
      
      if (fs.existsSync(ruPath)) {
        const ruModule = await import(`file://${ruPath}`);
        Object.assign(ruTranslations, ruModule.default);
      }
    }
  } catch (err) {
    console.warn(`Skipping ${file}:`, err.message);
  }
}

const manifestContent = `// This file is auto-generated. Do not edit manually.
// Run 'node scripts/generate-manifest.js' to regenerate.

${imports.join('\n')}

export const nodesManifest = [
${entries.join(',\n')}
];
`;

fs.writeFileSync(manifestPath, manifestContent);
console.log(`Generated ${manifestPath} with ${entries.length} nodes`);

// Генерируем translations.js
const translationsContent = `// This file is auto-generated. Do not edit manually.
// Run 'node scripts/generate-manifest.js' to regenerate.

export const nodeTranslations = {
  en: ${JSON.stringify(enTranslations, null, 2)},
  ru: ${JSON.stringify(ruTranslations, null, 2)}
};
`;

fs.writeFileSync(translationsPath, translationsContent);
console.log(`Generated ${translationsPath} with translations`);
