/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@renderer/utils';
import { Button } from '@renderer/components/ui/button';

import { IMAGE_PLACEHOLDER } from '@ui-tars/shared/constants';
import Prompts from '../Prompts';
import ThoughtChain from '../ThoughtChain';

import { api } from '@renderer/api';

// import ChatInput from '@renderer/components/ChatInput';

import { SidebarTrigger } from '@renderer/components/ui/sidebar';
import { ShareOptions } from '@/renderer/src/components/RunMessages/ShareOptions';
import { ClearHistory } from '@/renderer/src/components/RunMessages/ClearHistory';
import { useStore } from '@renderer/hooks/useStore';
import { useSession } from '@renderer/hooks/useSession';

import ImageGallery from '../ImageGallery';
import {
  ErrorMessage,
  HumanTextMessage,
  AssistantTextMessage,
  ScreenshotMessage,
  LoadingText,
} from './Messages';

const RunMessages = () => {
  const { messages = [], thinking, errorMsg } = useStore();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const suggestions: string[] = [];
  const [selectImg, setSelectImg] = useState<number | undefined>(undefined);
  const { currentSessionId, chatMessages, updateMessages } = useSession();
  const isWelcome = currentSessionId === '';

  // Debug: Log both message stores to see the difference
  useEffect(() => {
    // console.log('🔍 RAG DEBUG: Main store messages:', messages.length);
    // console.log('🔍 RAG DEBUG: Session store chatMessages:', chatMessages.length);
    // console.log('🔍 RAG DEBUG: currentSessionId:', currentSessionId);
    messages.forEach((msg, idx) => {
      if (msg.ragContext) {
        // console.log(`🔍 RAG DEBUG: Main store message ${idx} HAS ragContext (${msg.ragContext.length} items)`);
      }
    });
    chatMessages.forEach((msg, idx) => {
      if (msg.ragContext) {
        // console.log(`🔍 RAG DEBUG: Session store message ${idx} HAS ragContext (${msg.ragContext.length} items)`);
      }
    });
  }, [messages.length, chatMessages.length]);

  // Debug: Check if synchronization useEffect is being triggered
  // console.log('🔍 RAG DEBUG: RunMessages render - currentSessionId:', currentSessionId, 'messages.length:', messages.length, 'chatMessages.length:', chatMessages.length);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(!isWelcome);

  // console.log('currentSessionId', currentSessionId);
  useEffect(() => {
    // console.log('🔍 RAG DEBUG: Synchronization useEffect triggered - currentSessionId:', currentSessionId, 'messages.length:', messages.length);
    // console.log('useEffect updateMessages', currentSessionId, messages);
    if (currentSessionId && messages.length) {
      const existingMessagesSet = new Set(
        chatMessages.map(
          (msg) => `${msg.value}-${msg.from}-${msg.timing?.start}`,
        ),
      );
      const newMessages = messages.filter(
        (msg) =>
          !existingMessagesSet.has(
            `${msg.value}-${msg.from}-${msg.timing?.start}`,
          ),
      );

      // Debug: Check if ragContext is preserved in newMessages
      // console.log('🔍 RAG DEBUG: newMessages from main store:', newMessages.length);
      newMessages.forEach((msg, idx) => {
        if (msg.ragContext) {
          // console.log(`🔍 RAG DEBUG: newMessage ${idx} HAS ragContext (${msg.ragContext.length} items)`);
        } else {
          // console.log(`🔍 RAG DEBUG: newMessage ${idx} has NO ragContext`);
        }
      });

      const allMessages = [...chatMessages, ...newMessages];

      // Debug: Check if ragContext is preserved in allMessages
      // console.log('🔍 RAG DEBUG: allMessages before updateMessages:', allMessages.length);
      allMessages.forEach((msg, idx) => {
        if (msg.ragContext) {
          // console.log(`🔍 RAG DEBUG: allMessage ${idx} HAS ragContext (${msg.ragContext.length} items)`);
        } else {
          // console.log(`🔍 RAG DEBUG: allMessage ${idx} has NO ragContext`);
        }
      });

      updateMessages(currentSessionId, allMessages);
    } else {
      console.log(
        '🔍 RAG DEBUG: Synchronization skipped - currentSessionId:',
        currentSessionId,
        'messages.length:',
        messages.length,
      );
    }
  }, [currentSessionId, chatMessages.length, messages.length]);

  useEffect(() => {
    if (!currentSessionId.length) {
      setIsRightPanelOpen(false);
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (chatMessages.length) {
      setIsRightPanelOpen(true);
    }
  }, [chatMessages.length]);

  useEffect(() => {
    setTimeout(() => {
      containerRef.current?.scrollIntoView(false);
    }, 100);
  }, [messages, thinking, errorMsg]);

  const handleSelect = async (suggestion: string) => {
    await api.setInstructions({ instructions: suggestion });
  };

  const handleImageSelect = async (index: number) => {
    setIsRightPanelOpen(true);
    setSelectImg(index);
  };

  const renderChatList = () => {
    return (
      <div className="flex-1 w-full px-12 py-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        <div ref={containerRef}>
          {!chatMessages?.length && suggestions?.length > 0 && (
            <Prompts suggestions={suggestions} onSelect={handleSelect} />
          )}

          {chatMessages?.map((message, idx) => {
            if (message?.from === 'human') {
              if (message?.value === IMAGE_PLACEHOLDER) {
                // screen shot
                return (
                  <ScreenshotMessage
                    key={`message-${idx}`}
                    onClick={() => handleImageSelect(idx)}
                  />
                );
              }

              return (
                <HumanTextMessage
                  key={`message-${idx}`}
                  text={message?.value}
                />
              );
            }

            const { predictionParsed, screenshotBase64WithElementMarker } =
              message;

            // Find the finished step
            const finishedStep = predictionParsed?.find(
              (step) =>
                step.action_type === 'finished' &&
                step.action_inputs?.content &&
                typeof step.action_inputs.content === 'string' &&
                step.action_inputs.content.trim().length > 0,
            );

            // If there is a finished step, render the thought chain and the final result.
            // Otherwise, render the thought chain.
            return (
              <div key={idx}>
                {predictionParsed?.length ? (
                  <ThoughtChain
                    steps={predictionParsed}
                    hasSomImage={!!screenshotBase64WithElementMarker}
                    onClick={() => handleImageSelect(idx)}
                    ragContext={message.ragContext}
                  />
                ) : null}

                {finishedStep?.action_inputs?.content ? (
                  <AssistantTextMessage
                    text={finishedStep.action_inputs.content}
                  />
                ) : null}
              </div>
            );
          })}

          {thinking && <LoadingText text={'Thinking...'} />}
          {errorMsg && <ErrorMessage text={errorMsg} />}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex h-full justify-center">
      {/* Left Panel */}
      <div
        className={cn(
          'flex flex-col transition-all duration-300 ease-in-out',
          isRightPanelOpen ? 'w-1/2' : 'w-2/3 mx-auto',
        )}
      >
        <div className="flex w-full items-center mb-1">
          <SidebarTrigger className="ml-2 mr-auto size-9" />
          <ClearHistory />
          <ShareOptions />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="mr-4"
          >
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isRightPanelOpen ? 'rotate-0' : 'rotate-180',
              )}
            />
          </Button>
        </div>
        {!isWelcome && renderChatList()}
        {/* <ChatInput /> */}
      </div>

      {/* Right Panel */}
      <div
        className={cn(
          'h-full border-l border-border bg-background transition-all duration-300 ease-in-out',
          isRightPanelOpen
            ? 'w-1/2 opacity-100'
            : 'w-0 opacity-0 overflow-hidden',
        )}
      >
        <ImageGallery messages={chatMessages} selectImgIndex={selectImg} />
      </div>
    </div>
  );
};

export default RunMessages;
