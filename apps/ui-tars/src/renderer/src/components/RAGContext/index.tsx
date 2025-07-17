/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Database, FileText } from 'lucide-react';
import { Markdown } from '../markdown';

export interface RAGContextData {
  context: string;
  relevance: number;
  source?: string;
}

interface RAGContextProps {
  contexts: RAGContextData[];
}

export default function RAGContext({ contexts }: RAGContextProps) {
  // console.log('🔍 RAG DEBUG: RAGContext component called with:', contexts?.length || 0, 'contexts');

  if (!contexts || contexts.length === 0) {
    console.log('🔍 RAG DEBUG: No contexts to display, returning null');
    return null;
  }

  // console.log('🔍 RAG DEBUG: Rendering RAG contexts:', contexts);

  return (
    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <Database className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">
          Knowledge Base Context
        </span>
      </div>

      <div className="space-y-2">
        {contexts.map((ctx, index) => (
          <div key={index} className="p-2 bg-white rounded border">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">
                  {ctx.source || 'Unknown'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Relevance: {ctx.relevance.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              <Markdown>{ctx.context}</Markdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
