/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
// import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@renderer/components/ui/dropdown-menu';
import { Button } from '@renderer/components/ui/button';

import { Operator } from '@main/store/types';
import { useSession } from '../../hooks/useSession';
import {
  checkVLMSettings,
  LocalSettingsDialog,
} from '@renderer/components/Settings/local';
// import {
//   // checkRemoteBrowser,
//   // checkRemoteComputer,
//   RemoteSettingsDialog,
// } from '@renderer/components/Settings/remote';

import computerUseImg from '@resources/home_img/computer_use.png?url';
import browserUseImg from '@resources/home_img/browser_use.png?url';
import logoVector from '@resources/logo-vector.png?url';
import burpsuiteLogo from '@resources/burpsuite-logo.png?url';
import { sleep } from '@ui-tars/shared/utils';
import { FreeTrialDialog } from '../../components/AlertDialog/freeTrialDialog';
import { DragArea } from '../../components/Common/drag';

const FreeButton = ({
  onClick,
  children,
}: {
  children: string;
  onClick: () => void;
}) => {
  return (
    <div className="flex-1 relative">
      <Button className="w-full" onClick={onClick}>
        {children}
      </Button>
      <span
        className="absolute -top-3 right-0 text-[10px] px-2 py-0.5 font-semibold"
        style={{
          color: '#733E0F',
          borderRadius: '0.5rem 0.25rem 0.5rem 0',
          background: 'linear-gradient(90deg, #FEF5C4 0%, #F0C573 100%)',
        }}
      >
        Free Trial
      </span>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { createSession } = useSession();
  const [localConfig, setLocalConfig] = useState({
    open: false,
    operator: Operator.LocalComputer,
  });
  const [remoteConfig, setRemoteConfig] = useState({
    open: false,
    operator: Operator.RemoteComputer,
  });
  // const [remoteConfig, setRemoteConfig] = useState({
  //   open: false,
  //   operator: Operator.RemoteComputer,
  // });

  const toRemoteComputer = async (value: 'free' | 'paid') => {
    console.log('toRemoteComputer', value);
    const session = await createSession('New Session', {
      operator: Operator.RemoteComputer,
      isFree: value === 'free',
    });

    if (value === 'free') {
      navigate('/free-remote', {
        state: {
          operator: Operator.RemoteComputer,
          sessionId: session?.id,
          isFree: true,
          from: 'home',
        },
      });

      return;
    }

    navigate('/paid-remote', {
      state: {
        operator: Operator.RemoteComputer,
        sessionId: session?.id,
        isFree: false,
        from: 'home',
      },
    });
  };

  const toRemoteBrowser = async (value: 'free' | 'paid') => {
    console.log('toRemoteBrowser', value);

    const session = await createSession('New Session', {
      operator: Operator.RemoteBrowser,
      isFree: value === 'free',
    });

    if (value === 'free') {
      navigate('/free-remote', {
        state: {
          operator: Operator.RemoteBrowser,
          sessionId: session?.id,
          isFree: true,
          from: 'home',
        },
      });
      return;
    }

    navigate('/paid-remote', {
      state: {
        operator: Operator.RemoteBrowser,
        sessionId: session?.id,
        isFree: false,
        from: 'home',
      },
    });
  };

  // const handlePaidRemoteDialog = async (operator: Operator) => {
  //   setRemoteConfig({ open: true, operator: operator });
  // };

  // const handleReomteSettingsSubmit = async () => {
  //   setRemoteConfig({ open: false, operator: remoteConfig.operator });
  //   await sleep(200);
  //   // await toLocal(localConfig.operator);
  // };

  // const handleRemoteSettingsClose = () => {
  //   setRemoteConfig({ open: false, operator: remoteConfig.operator });
  // };

  /** local click logic start */
  const toLocal = async (operator: Operator) => {
    const session = await createSession('New Session', {
      operator: operator,
    });

    navigate('/local', {
      state: {
        operator: operator,
        sessionId: session?.id,
        from: 'home',
      },
    });
  };

  const handleLocalPress = async (operator: Operator) => {
    const hasVLM = await checkVLMSettings();

    if (hasVLM) {
      toLocal(operator);
    } else {
      setLocalConfig({ open: true, operator: operator });
    }
  };

  const handleRemotePress = async (operator: Operator) => {
    const isAgree = localStorage.getItem('isAgreeFreeTrialAgreement');

    if (isAgree) {
      if (operator === Operator.RemoteBrowser) {
        toRemoteBrowser('free');
      } else {
        toRemoteComputer('free');
      }
    } else {
      setRemoteConfig({ open: true, operator: operator });
    }
  };

  const handleFreeDialogComfirm = async () => {
    if (remoteConfig.operator === Operator.RemoteBrowser) {
      toRemoteBrowser('free');
    } else {
      toRemoteComputer('free');
    }
  };

  const handleRemoteDialogClose = (status: boolean) => {
    setRemoteConfig({ open: status, operator: remoteConfig.operator });
  };

  const handleLocalSettingsSubmit = async () => {
    setLocalConfig({ open: false, operator: localConfig.operator });

    await sleep(200);

    await toLocal(localConfig.operator);
  };

  const handleLocalSettingsClose = () => {
    setLocalConfig({ open: false, operator: localConfig.operator });
  };
  /** local click logic end */

  // const renderRemoteComputerButton = () => {
  //   return (
  //     <DropdownMenu>
  //       <DropdownMenuTrigger asChild>
  //         <Button className="flex-1">Use Remote Computer</Button>
  //       </DropdownMenuTrigger>
  //       <DropdownMenuContent className="ml-18">
  //         <DropdownMenuItem onClick={() => toRemoteComputer('free')}>
  //           Quick free trial
  //           <ChevronRight className="ml-auto" />
  //         </DropdownMenuItem>
  //         <DropdownMenuItem
  //           onClick={() => handlePaidRemoteDialog(Operator.RemoteComputer)}
  //         >
  //           Use your own site to experience
  //           <ChevronRight className="ml-auto" />
  //         </DropdownMenuItem>
  //       </DropdownMenuContent>
  //     </DropdownMenu>
  //   );
  // };

  // const renderRemoteBrowserButton = () => {
  //   return (
  //     <DropdownMenu>
  //       <DropdownMenuTrigger asChild>
  //         <Button className="flex-1">Use Remote Browser</Button>
  //       </DropdownMenuTrigger>
  //       <DropdownMenuContent className="ml-20">
  //         <DropdownMenuItem onClick={() => toRemoteBrowser('free')}>
  //           Quick free trial
  //           <ChevronRight className="ml-auto" />
  //         </DropdownMenuItem>
  //         <DropdownMenuItem
  //           onClick={() => handlePaidRemoteDialog(Operator.RemoteBrowser)}
  //         >
  //           Use your own site to experience
  //           <ChevronRight className="ml-auto" />
  //         </DropdownMenuItem>
  //       </DropdownMenuContent>
  //     </DropdownMenu>
  //   );
  // };

  return (
    <div className="w-full h-full flex flex-col">
      <DragArea></DragArea>
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mt-1 mb-12">
          {/* Welcome to UI-TARS Desktop */}
          Welcome to Burpsuite Computer Use Agent
        </h1>
        <div className="flex gap-6">
          <Card className="w-[400px] py-5">
            <CardHeader className="px-5">
              <CardTitle>Burpsuite Computer Use Agent</CardTitle>
              <CardDescription>
                Use the any OpenRouter model to automate Burpsuite tasks through
                Computer Use Vision Agents.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5">
              <div className="w-full h-full aspect-video rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 flex items-center justify-center">
                      <img
                        src={logoVector}
                        alt="UI-TARS"
                        className="w-20 h-20"
                      />
                    </div>
                    <span className="text-base font-medium text-gray-700 mt-3">
                      Bytedance UI-TARS
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-400">×</div>
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 flex items-center justify-center">
                      <img
                        src={burpsuiteLogo}
                        alt="Burpsuite"
                        className="w-20 h-20"
                      />
                    </div>
                    <span className="text-base font-medium text-gray-700 mt-3">
                      Burpsuite
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-3 px-5 flex justify-between">
              {/* {renderRemoteComputerButton()} */}
              {/* <FreeButton
                onClick={() => handleRemotePress(Operator.RemoteComputer)}
              >
                Use Remote Computer
              </FreeButton> */}
              <Button
                onClick={() => handleLocalPress(Operator.LocalComputer)}
                variant="secondary"
                className="flex-1"
              >
                Use Burpsuite
              </Button>
            </CardFooter>
          </Card>
          {/* <Card className="w-[400px] py-5">
            <CardHeader className="px-5">
              <CardTitle>Browser Operator</CardTitle>
              <CardDescription>
                Let the UI-TARS model help you automate browser tasks, from
                navigating pages to filling out forms.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5">
              <img
                src={browserUseImg}
                alt=""
                className="w-full h-full aspect-video object-fill rounded-lg"
              />
            </CardContent>
            <CardFooter className="gap-3 px-5 flex justify-between">
              <FreeButton
                onClick={() => handleRemotePress(Operator.RemoteBrowser)}
              >
                Use Remote Browser
              </FreeButton>
              <Button
                onClick={() => handleLocalPress(Operator.LocalBrowser)}
                variant="secondary"
                className="flex-1"
              >
                Use Local Browser
              </Button>
            </CardFooter>
          </Card> */}
        </div>
        <LocalSettingsDialog
          isOpen={localConfig.open}
          onSubmit={handleLocalSettingsSubmit}
          onClose={handleLocalSettingsClose}
        />
        {/* <RemoteSettingsDialog
          isOpen={remoteConfig.open}
          operator={remoteConfig.operator}
          onSubmit={handleReomteSettingsSubmit}
          onClose={handleRemoteSettingsClose}
        /> */}
        <FreeTrialDialog
          open={remoteConfig.open}
          onOpenChange={handleRemoteDialogClose}
          onConfirm={handleFreeDialogComfirm}
        />
      </div>
      <DragArea></DragArea>
    </div>
  );
};

export default Home;
