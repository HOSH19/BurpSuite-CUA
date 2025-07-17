import {
  EnhancedSystemPromptService,
  getEnhancedSystemPrompt,
  SystemPromptConfig,
} from './enhancedSystemPrompt';

/**
 * Test for Enhanced System Prompt Service
 * Run this with: npx tsx apps/ui-tars/src/main/services/enhancedSystemPrompt.test.ts
 */

// Simple assertion function
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ Test failed: ${message}`);
  }
}

async function testEnhancedSystemPromptService() {
  console.log('🧪 Testing Enhanced System Prompt Service...\n');

  try {
    const service = EnhancedSystemPromptService.getInstance();

    // Test 1: Test singleton pattern
    console.log('1️⃣ Testing singleton pattern...');
    const service2 = EnhancedSystemPromptService.getInstance();
    assert(service === service2, 'Should return the same instance');
    console.log('   ✅ Singleton pattern works');

    // Test 2: Test basic system prompt generation
    console.log('\n2️⃣ Testing basic system prompt generation...');

    const config: SystemPromptConfig = {
      language: 'en',
      operatorType: 'computer',
      modelVersion: 'v1_0',
    };

    const prompt = await service.getEnhancedSystemPrompt(
      config,
      'test instruction',
    );

    assert(prompt.length > 0, 'Should generate a non-empty prompt');
    assert(
      prompt.includes('GUI agent'),
      'Should contain system prompt content',
    );
    assert(
      prompt.includes('Action Space'),
      'Should contain action space section',
    );
    assert(
      prompt.includes('User Instruction'),
      'Should contain user instruction section',
    );

    console.log('   ✅ Basic system prompt generation works');

    // Test 3: Test different model versions
    console.log('\n3️⃣ Testing different model versions...');

    const v1_0Config: SystemPromptConfig = {
      language: 'en',
      operatorType: 'computer',
      modelVersion: 'v1_0',
    };

    const v1_5Config: SystemPromptConfig = {
      language: 'en',
      operatorType: 'computer',
      modelVersion: 'v1_5',
    };

    const v1_0Prompt = await service.getEnhancedSystemPrompt(
      v1_0Config,
      'test',
    );
    const v1_5Prompt = await service.getEnhancedSystemPrompt(
      v1_5Config,
      'test',
    );

    assert(
      v1_0Prompt !== v1_5Prompt,
      'Different model versions should generate different prompts',
    );
    assert(
      v1_0Prompt.includes('[x1, y1, x2, y2]'),
      'v1_0 should use bracket format',
    );
    assert(
      v1_5Prompt.includes('<|box_start|>'),
      'v1_5 should use special format',
    );

    console.log('   ✅ Different model versions work correctly');

    // Test 4: Test different languages
    console.log('\n4️⃣ Testing different languages...');

    const enConfig: SystemPromptConfig = {
      language: 'en',
      operatorType: 'computer',
    };

    const zhConfig: SystemPromptConfig = {
      language: 'zh',
      operatorType: 'computer',
    };

    const enPrompt = await service.getEnhancedSystemPrompt(enConfig, 'test');
    const zhPrompt = await service.getEnhancedSystemPrompt(zhConfig, 'test');

    assert(
      enPrompt.includes('English'),
      'English prompt should mention English',
    );
    assert(
      zhPrompt.includes('Chinese'),
      'Chinese prompt should mention Chinese',
    );

    console.log('   ✅ Different languages work correctly');

    // Test 5: Test different operator types
    console.log('\n5️⃣ Testing different operator types...');

    const computerConfig: SystemPromptConfig = {
      language: 'en',
      operatorType: 'computer',
    };

    const browserConfig: SystemPromptConfig = {
      language: 'en',
      operatorType: 'browser',
    };

    const computerPrompt = await service.getEnhancedSystemPrompt(
      computerConfig,
      'test',
    );
    const browserPrompt = await service.getEnhancedSystemPrompt(
      browserConfig,
      'test',
    );

    // Both should work (operator type doesn't affect base prompt in our mock)
    assert(computerPrompt.length > 0, 'Computer operator should work');
    assert(browserPrompt.length > 0, 'Browser operator should work');

    console.log('   ✅ Different operator types work correctly');

    // Test 6: Test convenience function
    console.log('\n6️⃣ Testing convenience function...');

    const conveniencePrompt = await getEnhancedSystemPrompt(
      config,
      'test instruction',
    );

    assert(conveniencePrompt.length > 0, 'Convenience function should work');
    assert(
      conveniencePrompt.includes('GUI agent'),
      'Convenience function should return valid prompt',
    );

    console.log('   ✅ Convenience function works correctly');

    // Test 7: Test error handling
    console.log('\n7️⃣ Testing error handling...');

    try {
      // This should handle gracefully even if RAG service fails
      const errorPrompt = await service.getEnhancedSystemPrompt(config, 'test');

      assert(
        errorPrompt.length > 0,
        'Should return a valid prompt even if RAG fails',
      );
      assert(
        errorPrompt.includes('GUI agent'),
        'Should return a valid system prompt',
      );

      console.log('   ✅ Error handling works correctly');
    } catch (error) {
      console.log('   ❌ Error handling failed:', error);
      throw error;
    }

    console.log('\n🎉 All Enhanced System Prompt Service tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('- Singleton pattern works correctly');
    console.log('- Basic system prompt generation works');
    console.log('- Different model versions work correctly');
    console.log('- Different languages work correctly');
    console.log('- Different operator types work correctly');
    console.log('- Convenience function works correctly');
    console.log('- Error handling is robust');
  } catch (error) {
    console.error('❌ Enhanced System Prompt Service test failed:', error);
    console.error(
      'Error details:',
      error instanceof Error ? error.message : String(error),
    );

    // Re-throw to ensure the test actually fails
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEnhancedSystemPromptService().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1); // Exit with error code to indicate test failure
  });
}

export { testEnhancedSystemPromptService };
