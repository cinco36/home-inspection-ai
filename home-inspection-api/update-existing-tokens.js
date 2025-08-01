const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/home_inspection',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Enhanced token estimation function
function estimateTokensEnhanced(text) {
  const words = text.trim().split(/\s+/).length;
  const characters = text.length;
  
  const wordBasedTokens = Math.ceil(words / 0.75);
  const charBasedTokens = Math.ceil(characters / 4);
  
  const estimatedTokens = Math.ceil((wordBasedTokens * 0.7) + (charBasedTokens * 0.3));
  const estimatedCostCents = Math.ceil((estimatedTokens / 1000) * 0.15 * 100); // gpt-3.5-turbo cost
  
  return { estimatedTokens, estimatedCostCents };
}

async function updateExistingTokens() {
  try {
    console.log('🔍 Finding files with extracted text but no token estimation...');
    
    const query = `
      SELECT id, original_filename, extracted_text 
      FROM files 
      WHERE extracted_text IS NOT NULL 
      AND (estimated_tokens IS NULL OR estimated_cost_cents IS NULL)
    `;
    
    const result = await pool.query(query);
    console.log(`📁 Found ${result.rows.length} files to update`);
    
    let updatedCount = 0;
    
    for (const file of result.rows) {
      if (file.extracted_text) {
        const { estimatedTokens, estimatedCostCents } = estimateTokensEnhanced(file.extracted_text);
        
        const updateQuery = `
          UPDATE files 
          SET estimated_tokens = $1, estimated_cost_cents = $2, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $3
        `;
        
        await pool.query(updateQuery, [estimatedTokens, estimatedCostCents, file.id]);
        
        console.log(`✅ Updated ${file.original_filename}: ${estimatedTokens} tokens, $${(estimatedCostCents / 100).toFixed(4)}`);
        updatedCount++;
      }
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} files with token estimation`);
    
  } catch (error) {
    console.error('❌ Error updating tokens:', error);
  } finally {
    await pool.end();
  }
}

updateExistingTokens(); 