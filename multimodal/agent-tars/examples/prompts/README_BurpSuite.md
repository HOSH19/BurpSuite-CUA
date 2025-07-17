# Burp Suite Automation with UI-TARS Desktop

This directory contains specialized prompts for automating Burp Suite cybersecurity testing workflows using UI-TARS Desktop's VLM capabilities.

## 🎯 Overview

These prompts are designed to break down complex cybersecurity testing tasks into specific, actionable steps that the VLM can execute through the UI-TARS Desktop interface. Each prompt is specialized for different aspects of Burp Suite functionality.

## 📁 Available Prompts

### 1. **burpsuiteProxy.ts** - HTTP Interception & Modification
- **Use Case**: Manual security testing, request manipulation, traffic analysis
- **Complexity**: Basic
- **Duration**: 10-30 minutes
- **Features**:
  - Proxy setup and configuration
  - HTTP request interception
  - Request modification for security testing
  - Response analysis

### 2. **burpsuiteScanner.ts** - Automated Security Scanning
- **Use Case**: Vulnerability assessment, automated testing, compliance scanning
- **Complexity**: Intermediate
- **Duration**: 30-120 minutes
- **Features**:
  - Automated vulnerability scanning
  - Active and passive scanning
  - Scan policy configuration
  - Results analysis and reporting

### 3. **burpsuiteRepeater.ts** - Manual Testing & Exploitation
- **Use Case**: Targeted vulnerability testing, proof of concept, manual exploitation
- **Complexity**: Advanced
- **Duration**: 60-180 minutes
- **Features**:
  - SQL injection testing
  - XSS testing
  - Authentication bypass testing
  - Input validation testing

### 4. **burpsuiteConfig.ts** - Configuration & Selection
- **Use Case**: Scenario selection and configuration management
- **Features**:
  - Scenario selection based on requirements
  - Usage examples
  - Safety guidelines
  - Prerequisites checklist

## 🚀 Quick Start

### Step 1: Choose Your Scenario
```typescript
import { selectBurpSuiteScenario, BURP_SUITE_SCENARIOS } from './burpsuiteConfig';

// Select based on your needs
const scenario = selectBurpSuiteScenario({
  automationLevel: 'manual',
  testingType: 'interception',
  complexity: 'basic'
});

console.log('Selected:', scenario?.name);
```

### Step 2: Run the Automation
```typescript
import { runAgentTARS } from '../default';

// For proxy interception
runAgentTARS(`
  [Your specific task description here]
  - Target: https://example.com
  - Objective: Test login form for SQL injection
  - Expected outcome: Identify vulnerabilities
`);
```

## 🔧 Customization

### Modifying System Prompts
The specialized Burp Suite system prompt is located in:
```
apps/ui-tars/src/main/agent/prompts.ts
```

You can modify the `getSystemPromptBurpSuite` function to add:
- Additional Burp Suite modules
- Custom testing methodologies
- Specific security frameworks
- Compliance requirements

### Creating Custom Prompts
1. Copy an existing prompt file
2. Modify the task description
3. Add specific testing scenarios
4. Update the expected outcomes

Example:
```typescript
runAgentTARS(`
  You are a specialized [YOUR_DOMAIN] testing agent.
  
  ## Task: [YOUR_SPECIFIC_TASK]
  
  ### Phase 1: [SETUP_STEPS]
  1. [Specific action]
  2. [Specific action]
  
  ### Phase 2: [TESTING_STEPS]
  [Your testing methodology]
  
  ## Expected Outcome
  [What you expect to achieve]
`);
```

## 🛡️ Safety & Best Practices

### Pre-requisites
- ✅ Burp Suite Professional/Community Edition installed
- ✅ Target web application accessible
- ✅ Proper network configuration
- ✅ Authorization to test target
- ✅ Understanding of web security concepts

### Safety Guidelines
- 🔒 Only test applications you own or have permission to test
- 🔒 Use test environments when possible
- 🔒 Avoid testing production systems without authorization
- 🔒 Document all testing activities
- 🔒 Follow responsible disclosure practices
- 🔒 Respect rate limits and system resources

## 📊 Integration with UI-TARS Desktop

### How It Works
1. **Prompt Processing**: Your specialized prompt is processed by the VLM
2. **Task Breakdown**: Complex tasks are broken into specific UI actions
3. **Screenshot Analysis**: VLM analyzes screenshots to understand current state
4. **Action Execution**: UI-TARS executes specific actions (click, type, etc.)
5. **Iterative Process**: Continues until task completion

### VLM Capabilities
- **Visual Understanding**: Analyzes Burp Suite interface elements
- **Context Awareness**: Understands current tab, state, and workflow
- **Adaptive Behavior**: Adjusts actions based on interface changes
- **Error Handling**: Manages unexpected situations gracefully

## 🔍 Troubleshooting

### Common Issues
1. **Burp Suite Not Found**: Ensure Burp Suite is installed and accessible
2. **Proxy Configuration**: Verify proxy settings (127.0.0.1:8080)
3. **Target Accessibility**: Confirm target application is reachable
4. **Permission Issues**: Check authorization for testing

### Debug Tips
- Use `wait()` actions to allow time for operations
- Check Burp Suite status indicators
- Monitor network traffic for errors
- Review action history for failed steps

## 📈 Advanced Usage

### Combining Scenarios
You can combine multiple scenarios for comprehensive testing:
```typescript
// Run proxy interception first
runAgentTARS(proxyPrompt);

// Then run automated scanning
runAgentTARS(scannerPrompt);

// Finally run targeted testing
runAgentTARS(repeaterPrompt);
```

### Custom Testing Frameworks
Extend the prompts to support:
- OWASP Top 10 testing
- NIST Cybersecurity Framework
- ISO 27001 compliance
- Custom security policies

## 🤝 Contributing

To add new Burp Suite automation scenarios:

1. Create a new prompt file following the naming convention
2. Add scenario details to `burpsuiteConfig.ts`
3. Update this README with new information
4. Test thoroughly with different target applications

## 📚 Resources

- [Burp Suite Documentation](https://portswigger.net/burp/documentation)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [UI-TARS Desktop Documentation](../README.md)
- [VLM Prompt Engineering Best Practices](../prompts/README.md)

---

**Note**: Always ensure you have proper authorization before testing any web application. These tools are for educational and authorized security testing purposes only.