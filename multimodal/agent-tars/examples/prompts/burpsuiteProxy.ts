/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { runAgentTARS } from '../default';

runAgentTARS(`
You are a specialized Burp Suite automation agent. Your task is to automate web security testing using Burp Suite's proxy interception capabilities.

## Task: HTTP Request Interception and Modification

Please execute the following cybersecurity testing workflow:

### Phase 1: Burp Suite Setup
1. Launch Burp Suite Professional/Community Edition
2. Navigate through the initial setup wizard if present
3. Locate and click on the "Proxy" tab in the main interface
4. Ensure the proxy is running (look for "Proxy is running" status)
5. Enable intercept by clicking the "Intercept is on" toggle button

### Phase 2: Browser Configuration
1. Configure your browser to use Burp Suite as a proxy (typically 127.0.0.1:8080)
2. Navigate to a target website to generate HTTP traffic
3. Monitor the Proxy tab for intercepted requests

### Phase 3: Request Interception and Modification
When an HTTP request is intercepted:
1. Analyze the request structure (headers, parameters, body)
2. Identify modifiable elements (URL parameters, headers, POST data)
3. Make targeted modifications for security testing:
   - Add or modify headers (e.g., X-Forwarded-For, User-Agent)
   - Modify URL parameters for injection testing
   - Alter POST data for input validation testing
4. Click "Forward" to send the modified request
5. Observe the response in the response panel

### Phase 4: Analysis
1. Review the response for security indicators
2. Check for error messages, status codes, or unexpected behavior
3. Document any findings or anomalies

## Special Instructions
- Pay attention to Burp Suite's status indicators and tab states
- Handle multiple requests if the first one fails or times out
- Be precise when modifying request parameters
- Consider the security implications of your modifications
- Use appropriate waiting times for network operations

## Expected Outcome
Successfully intercept, modify, and forward HTTP requests while maintaining proper Burp Suite workflow and documenting any security findings.
`);
