import { MessageCirclePlus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Card } from '@renderer/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Button } from '@renderer/components/ui/button';
import { SidebarTrigger, useSidebar } from '@renderer/components/ui/sidebar';
import { NavHeader } from '@renderer/components/Detail/NavHeader';
import { ScrollArea } from '@renderer/components/ui/scroll-area';

import { useStore } from '@renderer/hooks/useStore';
import { useSession } from '@renderer/hooks/useSession';
import Prompts from '../../components/Prompts';
import { IMAGE_PLACEHOLDER } from '@ui-tars/shared/constants';
import {
  AssistantTextMessage,
  ErrorMessage,
  HumanTextMessage,
  LoadingText,
  ScreenshotMessage,
} from '../../components/RunMessages/Messages';
import ThoughtChain from '../../components/ThoughtChain';
import { api } from '../../api';
import ImageGallery from '../../components/ImageGallery';
import { Operator } from '@main/store/types';
import { PredictionParsed, StatusEnum } from '@ui-tars/shared/types';
import { RouterState } from '../../typings';
import ChatInput from '../../components/ChatInput';
import { NavDialog } from '../../components/AlertDialog/navDialog';
import {
  checkVLMSettings,
  LocalSettingsDialog,
} from '../../components/Settings/local';
import { sleep } from '@ui-tars/shared/utils';

const getFinishedContent = (predictionParsed?: PredictionParsed[]) =>
  predictionParsed?.find(
    (step) =>
      step.action_type === 'finished' &&
      typeof step.action_inputs?.content === 'string' &&
      step.action_inputs.content.trim() !== '',
  )?.action_inputs?.content as string | undefined;

const LocalOperator = () => {
  const locationState = useLocation().state as RouterState | null;
  const navigate = useNavigate();
  const { setOpen } = useSidebar();

  const { status, messages = [], thinking, errorMsg } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestions: string[] = [];
  const [selectImg, setSelectImg] = useState<number | undefined>(undefined);
  const [initId, setInitId] = useState('');
  const {
    currentSessionId,
    setActiveSession,
    updateMessages,
    createSession,
    chatMessages,
  } = useSession();
  const [pendingAction, setPendingAction] = useState<'newChat' | 'back' | null>(
    null,
  );
  const [isNavDialogOpen, setNavDialogOpen] = useState(false);
  const [localOpen, setLocalOpen] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      if (locationState?.sessionId) {
        // Use existing session from router state
        console.log(
          '🔍 SESSION DEBUG: Using existing session:',
          locationState.sessionId,
        );
        await setActiveSession(locationState.sessionId);
        setInitId(locationState.sessionId);
      } else {
        // No router state provided - create a new session (direct navigation)
        console.log(
          '🔍 SESSION DEBUG: Creating new session for direct navigation',
        );
        const newSession = await createSession('New Session', {
          operator: Operator.LocalComputer,
        });
        if (newSession) {
          console.log('🔍 SESSION DEBUG: New session created:', newSession.id);
          await setActiveSession(newSession.id);
          setInitId(newSession.id);

          // Ensure the session is properly set in the store
          await new Promise((resolve) => setTimeout(resolve, 100));
          console.log('🔍 SESSION DEBUG: Session initialization complete');
        }
      }
    };

    initializeSession();
  }, [locationState, setActiveSession, createSession]);

  useEffect(() => {
    console.log(
      '🔍 SYNC DEBUG: Message sync useEffect - initId:',
      initId,
      'locationState?.sessionId:',
      locationState?.sessionId,
    );
    if (initId !== locationState?.sessionId) {
      console.log('🔍 SYNC DEBUG: Session ID mismatch, skipping sync');
      return;
    }

    if (
      locationState?.sessionId &&
      currentSessionId &&
      locationState.sessionId !== currentSessionId
    ) {
      console.log(
        '🔍 SYNC DEBUG: Session ID mismatch with current session, skipping sync',
      );
      return;
    }

    if (messages.length) {
      console.log(
        '🔍 SYNC DEBUG: Synchronizing messages - messages.length:',
        messages.length,
        'chatMessages.length:',
        chatMessages.length,
      );

      // Check for RAG context in messages
      messages.forEach((msg, idx) => {
        if (msg.ragContext) {
          console.log(
            `🔍 SYNC DEBUG: Message ${idx} HAS ragContext (${msg.ragContext.length} items)`,
          );
        }
      });

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

      console.log('🔍 SYNC DEBUG: New messages to sync:', newMessages.length);
      newMessages.forEach((msg, idx) => {
        if (msg.ragContext) {
          console.log(
            `🔍 SYNC DEBUG: New message ${idx} HAS ragContext (${msg.ragContext.length} items)`,
          );
        } else {
          console.log(`🔍 SYNC DEBUG: New message ${idx} has NO ragContext`);
        }
      });

      const allMessages = [...chatMessages, ...newMessages];

      updateMessages(locationState?.sessionId || initId, allMessages);
    }
  }, [
    initId,
    locationState?.sessionId,
    currentSessionId,
    chatMessages.length,
    messages.length,
    updateMessages,
  ]);

  useEffect(() => {
    setTimeout(() => {
      containerRef.current?.scrollIntoView(false);
    }, 100);
  }, [messages, thinking, errorMsg]);

  const handleSelect = async (suggestion: string) => {
    await api.setInstructions({ instructions: suggestion });
  };

  const handleImageSelect = async (index: number) => {
    setSelectImg(index);
  };

  // check status before nav
  const needsConfirm =
    status === StatusEnum.RUNNING ||
    status === StatusEnum.CALL_USER ||
    status === StatusEnum.PAUSE;

  const onNewChat = useCallback(async () => {
    const session = await createSession('New Session', {
      operator: locationState?.operator || Operator.LocalComputer,
    });

    navigate('/local', {
      state: {
        operator: locationState?.operator || Operator.LocalComputer,
        sessionId: session?.id,
        from: 'new',
      },
    });
  }, []);

  const onBack = useCallback(async () => {
    navigate('/');
  }, []);

  const handleNewChat = useCallback(() => {
    if (needsConfirm) {
      setPendingAction('newChat');
      setNavDialogOpen(true);
    } else {
      onNewChat();
    }
  }, [needsConfirm]);

  const handleBack = useCallback(() => {
    if (needsConfirm) {
      setPendingAction('back');
      setNavDialogOpen(true);
    } else {
      onBack();
    }
  }, [needsConfirm]);

  const onConfirm = useCallback(async () => {
    await api.stopRun();
    await api.clearHistory();

    if (pendingAction === 'newChat') {
      await onNewChat();
    } else if (pendingAction === 'back') {
      await onBack();
    }
    setPendingAction(null);
    setNavDialogOpen(false);
  }, [pendingAction]);

  const onCancel = useCallback(() => {
    setPendingAction(null);
    setNavDialogOpen(false);
  }, []);

  const handleLocalSettingsSubmit = async () => {
    setLocalOpen(false);

    await sleep(200);
  };

  const handleLocalSettingsClose = () => {
    setLocalOpen(false);
  };

  const checkVLM = async () => {
    const hasVLM = await checkVLMSettings();

    if (hasVLM) {
      return true;
    } else {
      setLocalOpen(true);
      return false;
    }
  };

  const renderChatList = () => {
    return (
      <ScrollArea className="h-full px-4">
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

            // Find the finished step (VL 1.5 Model)
            const finishedStep = getFinishedContent(predictionParsed);

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

                {!!finishedStep && <AssistantTextMessage text={finishedStep} />}
              </div>
            );
          })}

          {thinking && <LoadingText text={'Thinking...'} />}
          {errorMsg && <ErrorMessage text={errorMsg} />}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="flex flex-col w-full h-full">
      <NavHeader
        title={locationState?.operator || Operator.LocalComputer}
        onBack={handleBack}
        docUrl="https://github.com/bytedance/UI-TARS-desktop/"
      ></NavHeader>
      <div className="px-5 pb-5 flex flex-1 gap-5">
        <Card className="flex-1 basis-2/5 px-0 py-4 gap-4 h-[calc(100vh-76px)]">
          <div className="flex items-center justify-between w-full px-4">
            <SidebarTrigger
              variant="secondary"
              className="size-8"
            ></SidebarTrigger>
            <Button variant="outline" size="sm" onClick={handleNewChat}>
              <MessageCirclePlus />
              New Chat
            </Button>
          </div>
          {renderChatList()}
          <ChatInput
            disabled={false}
            operator={locationState?.operator || Operator.LocalComputer}
            sessionId={locationState?.sessionId || initId}
            checkBeforeRun={checkVLM}
          />
        </Card>
        <Card className="flex-1 basis-3/5 p-3 h-[calc(100vh-76px)]">
          <Tabs defaultValue="screenshot" className="flex-1">
            <TabsList>
              <TabsTrigger value="screenshot">ScreenShot</TabsTrigger>
            </TabsList>
            <TabsContent value="screenshot">
              <ImageGallery
                messages={chatMessages}
                selectImgIndex={selectImg}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      <NavDialog
        open={isNavDialogOpen}
        onOpenChange={onCancel}
        onConfirm={onConfirm}
      />
      <LocalSettingsDialog
        isOpen={localOpen}
        onSubmit={handleLocalSettingsSubmit}
        onClose={handleLocalSettingsClose}
      />
    </div>
  );
};

export default LocalOperator;
