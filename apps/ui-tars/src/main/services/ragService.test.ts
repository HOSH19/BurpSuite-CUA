import { RAGService } from './ragService';

/**
 * Simple test script for RAG Service
 * Run this with: npx tsx apps/ui-tars/src/main/services/ragService.test.ts
 */

async function testRAGService() {
  console.log('🧪 Testing RAG Service (TypeScript)...\n');

  const ragService = RAGService.getInstance();

  try {
    // Test 1: Basic connection test
    console.log('1️⃣ Testing RAG connection...');
    const testResults = await ragService.queryRAG('test', 1);
    console.log('✅ Connection successful!');
    console.log(`   Found ${testResults.length} results\n`);

    // Test 2: Query with actual content
    console.log('2️⃣ Testing RAG query with content...');
    const queryResults = await ragService.queryRAG('documentation', 3);
    console.log(`✅ Query successful! Found ${queryResults.length} results`);

    if (queryResults.length > 0) {
      console.log('\n📄 Sample results:');
      queryResults.forEach((result, index) => {
        console.log(`   Result ${index + 1}:`);
        console.log(`   - Relevance: ${result.relevance.toFixed(3)}`);
        console.log(`   - Source: ${result.source}`);
        console.log(
          `   - Content preview: ${result.context.substring(0, 100)}...`,
        );
        console.log('');
      });
    }

    // Test 3: Get RAG context for system prompt
    console.log('3️⃣ Testing RAG context generation...');
    const context = await ragService.getRAGContext(
      'How do I use the application?',
    );
    console.log('✅ Context generation successful!');
    console.log(`   Context length: ${context.length} characters`);

    if (context) {
      console.log('\n📝 Generated context preview:');
      console.log(context.substring(0, 300) + '...\n');
    } else {
      console.log('   No context generated (empty result)\n');
    }

    console.log('🎉 All TypeScript RAG tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(
      'Error details:',
      error instanceof Error ? error.message : String(error),
    );

    console.log('\n🔍 Debugging information:');
    console.log('- Make sure Python is installed and accessible');
    console.log(
      '- Verify ChromaDB dependencies are installed: pip install chromadb sentence-transformers more-itertools',
    );
    console.log(
      '- Check that the RAG database exists at: ../resources/rag-data/chroma_db',
    );
    console.log(
      '- Ensure rag_utils.py is in the same directory as ragService.ts',
    );
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRAGService().catch(console.error);
}

export { testRAGService };
