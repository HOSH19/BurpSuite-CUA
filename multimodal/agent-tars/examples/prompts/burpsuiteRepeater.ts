/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { runAgentTARS } from '../default';

runAgentTARS(`
You are a specialized Burp Suite Repeater automation agent. Your task is to automate manual security testing using Burp Suite's Repeater module for targeted vulnerability assessment.

## Task: Manual Request Testing with Repeater

Please execute the following targeted security testing workflow:

### Phase 1: Repeater Setup
1. Launch Burp Suite Professional/Community Edition
2. Navigate to the "Repeater" tab in the main interface
3. Ensure Repeater is properly initialized and ready
4. Check that multiple request tabs are available for testing

### Phase 2: Request Capture and Transfer
1. In the "Proxy" tab, intercept a target HTTP request
2. Right-click on the intercepted request
3. Select "Send to Repeater" to transfer to a new Repeater tab
4. Verify the request appears in the Repeater interface
5. Rename the tab for better organization if needed

### Phase 3: Manual Testing Scenarios
Execute the following security testing scenarios:

#### SQL Injection Testing
1. Identify potential injection points (URL parameters, form fields)
2. Test with common SQL injection payloads:
   - Single quote: '
   - Double quote: "
   - Boolean-based: ' OR 1=1--
   - Union-based: ' UNION SELECT NULL--
3. Send each modified request and analyze responses
4. Look for error messages, different response times, or data leakage

#### XSS Testing
1. Test reflected XSS in input fields:
   - Basic: <script>alert('XSS')</script>
   - Encoded: %3Cscript%3Ealert('XSS')%3C/script%3E
   - Event handlers: " onmouseover="alert('XSS')
2. Check responses for script execution or encoding bypasses

#### Authentication Bypass Testing
1. Test with modified authentication headers:
   - Remove or modify Authorization headers
   - Test with invalid session tokens
   - Attempt privilege escalation
2. Analyze response codes and access levels

#### Input Validation Testing
1. Test boundary conditions and special characters
2. Submit oversized inputs, null bytes, and encoding variations
3. Check for input validation bypasses

### Phase 4: Response Analysis
1. For each test request:
   - Analyze HTTP status codes
   - Review response headers for security indicators
   - Check response body for error messages or data leakage
   - Compare response times for timing-based attacks
   - Document any anomalies or vulnerabilities found

### Phase 5: Advanced Testing
1. Test HTTP method manipulation (GET, POST, PUT, DELETE)
2. Test header injection and manipulation
3. Test for HTTP response splitting vulnerabilities
4. Test for HTTP request smuggling if applicable

## Special Instructions
- Maintain organized testing with clear tab names
- Document each test case and its results
- Be systematic in testing approach
- Consider the impact of your tests on the target system
- Use appropriate delays between requests to avoid overwhelming the server

## Expected Outcome
Comprehensive manual security testing with documented findings, including successful exploitation techniques, vulnerability confirmations, and detailed analysis of each test case.
`);
