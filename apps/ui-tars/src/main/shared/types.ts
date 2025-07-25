/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Conversation } from '@ui-tars/shared/types';

export interface ConversationWithSoM extends Conversation {
  screenshotBase64WithElementMarker?: string;
  ragContext?: Array<{
    context: string;
    relevance: number;
    source?: string;
  }>;
  isVerificationPrompt?: boolean; // Mark conversations with custom verification prompts
}
