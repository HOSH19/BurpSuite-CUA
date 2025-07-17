import { RAGService } from './ragService';

/**
 * Debug script for RAG Service
 * Run this with: npx tsx apps/ui-tars/src/main/services/debugRAG.ts
 */

async function debugRAGService() {
  console.log('🔍 Debugging RAG Service...\n');

  const ragService = RAGService.getInstance();

  const testQueries = [
    'documentation help',
    'random query that should return no results',
    'test query',
    'How do I use the application?',
    'browser automation',
    'computer operator',
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Testing query: "${query}"`);

    try {
      const context = await ragService.getRAGContext(query);

      if (context) {
        console.log(`   ✅ Context returned (${context.length} chars)`);
        console.log(
          `   Contains header: ${context.includes('RELEVANT CONTEXT FROM KNOWLEDGE BASE')}`,
        );
        console.log(`   Contains relevance: ${context.includes('Relevance:')}`);
        console.log(`   Contains source: ${context.includes('Source:')}`);

        // Show first 200 characters of context
        const preview = context.substring(0, 200);
        console.log(`   Preview: ${preview}...`);
      } else {
        console.log(`   ⚠️ No context returned (empty result)`);
      }
    } catch (error) {
      console.log(
        `   ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log('\n🔍 Debug Summary:');
  console.log(
    '- This helps understand what the RAG service is actually returning',
  );
  console.log(
    '- If you see contexts for "random" queries, the service might be working',
  );
  console.log('- If you see errors, check Python/ChromaDB setup');
}

// Run the debug script if this file is executed directly
if (require.main === module) {
  debugRAGService().catch(console.error);
}

export { debugRAGService };
