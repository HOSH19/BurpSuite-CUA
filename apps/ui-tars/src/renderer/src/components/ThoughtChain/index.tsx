/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { MousePointerClick, Database, FileText } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';

import { PredictionParsed } from '@ui-tars/shared/types';
import { ActionIconMap } from '@renderer/const/actions';
import { Markdown } from '../markdown';
import { RAGContextData } from '../RAGContext';

interface ThoughtStepCardProps {
  step: PredictionParsed;
  index: number;
  onClick?: () => void;
  hasSomImage: boolean;
}

function ThoughtStepCard({ step, onClick, hasSomImage }: ThoughtStepCardProps) {
  const ActionIcon = ActionIconMap[step?.action_type] || MousePointerClick;

  return (
    <>
      {step.action_type && (
        <Button
          variant="outline"
          className="rounded-full mb-6"
          size="sm"
          onClick={onClick}
          disabled={!hasSomImage}
        >
          <ActionIcon className="h-4 w-4" />
          {step.action_type === 'call_user' ? (
            'Waiting for user to take control'
          ) : (
            <>
              Action:
              <span className="text-gray-600 max-w-50 truncate">
                {step.action_type}
                {step.action_inputs?.start_box &&
                  ` (start_box: ${step.action_inputs.start_box})`}
                {step.action_inputs?.content &&
                  ` (${step.action_inputs.content})`}
                {step.action_inputs?.key && ` (${step.action_inputs.key})`}
              </span>
            </>
          )}
        </Button>
      )}
    </>
  );
}

interface ThoughtChainProps {
  steps: PredictionParsed[];
  hasSomImage: boolean;
  somImageHighlighted?: boolean;
  onClick?: () => void;
  ragContext?: RAGContextData[];
}

export default function ThoughtChain({
  steps,
  onClick,
  hasSomImage,
  ragContext,
}: ThoughtChainProps) {
  const reflectionStep = steps?.find((step) => step.reflection);
  const thoughtStep = steps?.find((step) => step.thought);

  // console.log('🔍 RAG DEBUG: ThoughtChain received ragContext:', ragContext?.length || 0, 'contexts');

  return (
    <div>
      {/* Display RAG context at the top of the chain of thought */}
      {ragContext && ragContext.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Knowledge Base Context
            </span>
          </div>

          <div className="space-y-2">
            {ragContext.map((ctx, index) => (
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
      )}

      {reflectionStep && (
        <div className="my-3 text-gray-600">
          <Markdown>{reflectionStep.reflection || ''}</Markdown>
        </div>
      )}

      {thoughtStep?.thought && (
        <div className="my-3 text-gray-600">
          <Markdown>{thoughtStep.thought || ''}</Markdown>
        </div>
      )}

      {steps?.map?.((step, index) => (
        <ThoughtStepCard
          key={index}
          step={step}
          index={index}
          onClick={onClick}
          hasSomImage={hasSomImage}
        />
      ))}
    </div>
  );
}
