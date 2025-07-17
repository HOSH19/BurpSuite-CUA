/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Burp Suite Automation Configuration
 * This file provides guidance on selecting the appropriate Burp Suite automation scenario
 * based on your cybersecurity testing needs.
 */

export interface BurpSuiteScenario {
  name: string;
  description: string;
  useCase: string;
  file: string;
  complexity: 'Basic' | 'Intermediate' | 'Advanced';
  estimatedDuration: string;
}

export const BURP_SUITE_SCENARIOS: BurpSuiteScenario[] = [
  {
    name: 'Proxy Interception',
    description: 'Automate HTTP request interception and modification for manual security testing',
    useCase: 'Manual security testing, request manipulation, traffic analysis',
    file: 'burpsuiteProxy.ts',
    complexity: 'Basic',
    estimatedDuration: '10-30 minutes',
  },
  {
    name: 'Automated Scanning',
    description: 'Run comprehensive automated security scans using Burp Suite Scanner',
    useCase: 'Vulnerability assessment, automated testing, compliance scanning',
    file: 'burpsuiteScanner.ts',
    complexity: 'Intermediate',
    estimatedDuration: '30-120 minutes',
  },
  {
    name: 'Manual Testing with Repeater',
    description: 'Perform targeted manual security testing using Burp Suite Repeater',
    useCase: 'Targeted vulnerability testing, proof of concept, manual exploitation',
    file: 'burpsuiteRepeater.ts',
    complexity: 'Advanced',
    estimatedDuration: '60-180 minutes',
  },
];

/**
 * Helper function to select the appropriate scenario based on requirements
 */
export function selectBurpSuiteScenario(requirements: {
  automationLevel: 'manual' | 'automated' | 'targeted';
  testingType: 'interception' | 'scanning' | 'exploitation';
  complexity: 'basic' | 'intermediate' | 'advanced';
}): BurpSuiteScenario | null {
  const { automationLevel, testingType, complexity } = requirements;

  if (automationLevel === 'manual' && testingType === 'interception') {
    return BURP_SUITE_SCENARIOS.find((s) => s.file === 'burpsuiteProxy.ts') || null;
  }

  if (automationLevel === 'automated' && testingType === 'scanning') {
    return BURP_SUITE_SCENARIOS.find((s) => s.file === 'burpsuiteScanner.ts') || null;
  }

  if (automationLevel === 'targeted' && testingType === 'exploitation') {
    return BURP_SUITE_SCENARIOS.find((s) => s.file === 'burpsuiteRepeater.ts') || null;
  }

  // Fallback based on complexity
  return BURP_SUITE_SCENARIOS.find((s) => s.complexity.toLowerCase() === complexity) || null;
}

/**
 * Usage examples for each scenario
 */
export const USAGE_EXAMPLES = {
  proxy: `
// For basic HTTP interception and modification
import { runAgentTARS } from '../default';
import { BURP_SUITE_SCENARIOS } from './burpsuiteConfig';

// Select proxy scenario
const scenario = BURP_SUITE_SCENARIOS.find(s => s.file === 'burpsuiteProxy.ts');
console.log('Selected scenario:', scenario?.name);

// Run the automation
runAgentTARS(\`
  [Your specific proxy interception task here]
\`);
  `,

  scanner: `
// For automated security scanning
import { runAgentTARS } from '../default';

runAgentTARS(\`
  [Your specific scanning requirements here]
  - Target URL: https://example.com
  - Scan policy: Medium
  - Scope: All endpoints
\`);
  `,

  repeater: `
// For targeted manual testing
import { runAgentTARS } from '../default';

runAgentTARS(\`
  [Your specific testing scenario here]
  - Test SQL injection in login form
  - Test XSS in search functionality
  - Test authentication bypass
\`);
  `,
};

/**
 * Pre-requisites for Burp Suite automation
 */
export const PREREQUISITES = [
  'Burp Suite Professional or Community Edition installed',
  'Target web application accessible',
  'Proper network configuration for proxy setup',
  'Authorization to test the target application',
  'Understanding of web application security concepts',
];

/**
 * Safety guidelines for security testing
 */
export const SAFETY_GUIDELINES = [
  'Only test applications you own or have explicit permission to test',
  'Use test environments when possible',
  'Avoid testing production systems without authorization',
  'Document all testing activities',
  'Follow responsible disclosure practices',
  'Respect rate limits and system resources',
];
