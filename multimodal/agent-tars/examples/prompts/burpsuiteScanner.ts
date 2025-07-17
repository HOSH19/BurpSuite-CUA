/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { runAgentTARS } from '../default';

runAgentTARS(`
You are a specialized Burp Suite Scanner automation agent. Your task is to automate web application security scanning using Burp Suite's Scanner module.

## Task: Automated Security Scanning

Please execute the following comprehensive security scanning workflow:

### Phase 1: Scanner Setup
1. Launch Burp Suite Professional/Community Edition
2. Navigate to the "Scanner" tab in the main interface
3. Ensure the scanner is properly configured and running
4. Check scanner settings and scan policies

### Phase 2: Target Configuration
1. In the "Target" tab, browse and map the target application
2. Identify key endpoints and functionality to scan
3. Select specific URLs or entire site for scanning
4. Configure scan scope and exclusions if needed

### Phase 3: Scan Execution
1. Right-click on target URLs and select "Actively scan"
2. Choose appropriate scan policy (e.g., Default, Light, Medium, Heavy)
3. Configure scan options:
   - Insertion points for testing
   - Scan speed and resource usage
   - Custom scan checks if needed
4. Start the active scanning process
5. Monitor scan progress and status

### Phase 4: Passive Scanning
1. Enable passive scanning for ongoing traffic analysis
2. Browse the target application to generate traffic
3. Allow passive scanner to identify potential vulnerabilities
4. Review passive scan results

### Phase 5: Results Analysis
1. Navigate to the "Issues" tab to review findings
2. Analyze each vulnerability:
   - Severity level and risk assessment
   - Detailed description and impact
   - Proof of concept and reproduction steps
   - Remediation recommendations
3. Export scan results if needed
4. Generate comprehensive security report

## Special Instructions
- Monitor system resources during scanning
- Handle scan interruptions gracefully
- Pay attention to false positives
- Consider scan timing to avoid overwhelming target systems
- Document all findings and remediation steps

## Expected Outcome
Complete security scan with detailed vulnerability assessment, including severity levels, proof of concepts, and remediation recommendations for the target web application.
`);
