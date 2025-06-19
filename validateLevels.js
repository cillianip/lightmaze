import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function validateAllLevels() {
  const levelsDir = join(__dirname, 'public', 'levels');
  const files = await readdir(levelsDir);
  const levelFiles = files.filter(f => f.endsWith('.json'));
  
  console.log(`\nValidating ${levelFiles.length} levels...\n`);
  
  const results = {
    valid: [],
    invalid: [],
    errors: []
  };
  
  for (const file of levelFiles) {
    try {
      const content = await readFile(join(levelsDir, file), 'utf-8');
      const levelData = JSON.parse(content);
      
      // Basic validation
      const issues = [];
      
      if (!levelData.lightSource) {
        issues.push('Missing light source');
      }
      
      if (!levelData.crystals || levelData.crystals.length === 0) {
        issues.push('No crystals defined');
      }
      
      if (!levelData.walls || levelData.walls.length === 0) {
        issues.push('No walls defined');
      }
      
      if (!levelData.name) {
        issues.push('Missing level name');
      }
      
      if (levelData.parMoves === undefined) {
        issues.push('Missing par moves');
      }
      
      if (issues.length > 0) {
        results.invalid.push({
          file,
          issues,
          level: levelData
        });
      } else {
        results.valid.push({
          file,
          name: levelData.name,
          crystals: levelData.crystals.length,
          mirrors: levelData.mirrors ? levelData.mirrors.length : 0,
          parMoves: levelData.parMoves
        });
      }
      
    } catch (error) {
      results.errors.push({
        file,
        error: error.message
      });
    }
  }
  
  // Print results
  console.log('=== VALIDATION RESULTS ===\n');
  
  console.log(`✅ Valid levels: ${results.valid.length}`);
  results.valid.forEach(level => {
    console.log(`   - ${level.file}: "${level.name}" (${level.crystals} crystals, ${level.mirrors} mirrors, par: ${level.parMoves})`);
  });
  
  if (results.invalid.length > 0) {
    console.log(`\n❌ Invalid levels: ${results.invalid.length}`);
    results.invalid.forEach(level => {
      console.log(`   - ${level.file}:`);
      level.issues.forEach(issue => {
        console.log(`     • ${issue}`);
      });
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${results.errors.length}`);
    results.errors.forEach(err => {
      console.log(`   - ${err.file}: ${err.error}`);
    });
  }
  
  // Check specific level
  const wallBounceLevel = results.valid.find(l => l.file === 'world1-03.json');
  if (wallBounceLevel) {
    console.log(`\n🔍 Checking "Wall Bounce" level specifically...`);
    const content = await readFile(join(levelsDir, 'world1-03.json'), 'utf-8');
    const levelData = JSON.parse(content);
    
    console.log('Light source:', levelData.lightSource);
    console.log('Crystals:', levelData.crystals);
    console.log('Mirrors:', levelData.mirrors || 'No draggable mirrors');
    
    // This level might need a mirror to be solvable
    if (!levelData.mirrors || levelData.mirrors.length === 0) {
      console.log('\n⚠️  This level has no draggable mirrors - it may be impossible if the light cannot reach the crystal directly!');
    }
  }
}

validateAllLevels().catch(console.error);