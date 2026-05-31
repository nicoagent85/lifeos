"use client";
import React, { useState } from 'react';
import { GameState, ScenarioKey, ActionType, getStartingState, resolveTurn, ACTION_POINTS_PER_WEEK, LedgerEntry } from '@lifeos/engine';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ACTION_DESCRIPTIONS: Record<ActionType, { name: string, desc: string, costStr: string }> = {
  WORK: { name: 'Work', desc: 'Earn wage (-Health, +Stress)', costStr: 'Free' },
  STUDY_WORK: { name: 'Study (Career)', desc: 'Improve Work Skill (+Stress)', costStr: 'Free' },
  STUDY_LIFE: { name: 'Study (Life)', desc: 'Improve Life Skill', costStr: 'Free' },
  REST: { name: 'Rest', desc: 'Recover Health, reduce Stress', costStr: 'Free' },
  JOB_HUNT: { name: 'Job Hunt', desc: 'Try to get promoted (+Stress)', costStr: 'Free' },
  SIDE_GIG: { name: 'Side Gig', desc: 'Earn extra cash (-Health, ++Stress)', costStr: 'Free' },
  EAT_HEALTHY: { name: 'Eat Healthy', desc: 'Boost Health & Happiness', costStr: '-$25' },
  WORK_OUT: { name: 'Work Out', desc: 'Boost Health, reduce Stress', costStr: 'Free' },
  HAVE_FUN: { name: 'Have Fun', desc: 'Boost Happiness, reduce Stress', costStr: '-$50' },
};

function StatWithTooltip({ label, value, tooltip, valueClass = "font-bold text-lg" }: { label: React.ReactNode, value: React.ReactNode, tooltip: string, valueClass?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="cursor-help flex flex-col justify-between py-1">
          <div className="text-xs text-muted-foreground whitespace-nowrap">{label}</div>
          <div className={valueClass}>{value}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function GameUI() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [actions, setActions] = useState<Record<ActionType, number>>({
    WORK: 0, STUDY_WORK: 0, STUDY_LIFE: 0, REST: 0, JOB_HUNT: 0, SIDE_GIG: 0, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 0
  });

  const [turnLogs, setTurnLogs] = useState<{ week: number, log: string[], ledger: LedgerEntry[] }[]>([]);

  if (!gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-1 md:col-span-3">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">LifeOS</CardTitle>
              <CardDescription>Choose your starting scenario</CardDescription>
            </CardHeader>
          </Card>
          
          <ScenarioCard 
            title="Broke Young Adult" 
            desc="Start with $500, gig work. High stress, low cash." 
            onClick={() => startGame('BROKE_YOUNG_ADULT')} 
          />
          <ScenarioCard 
            title="Laid Off" 
            desc="Start with $3000, high expenses. Skilled, but burning cash." 
            onClick={() => startGame('LAID_OFF')} 
          />
          <ScenarioCard 
            title="Student" 
            desc="Start with $100, low expenses. Lots of learning ahead." 
            onClick={() => startGame('STUDENT')} 
          />
        </div>
      </div>
    );
  }

  const apLimit = ACTION_POINTS_PER_WEEK + (gameState.health >= 80 && gameState.stress <= 30 ? 1 : 0);
  const apUsed = Object.values(actions).reduce((a, b) => a + b, 0);
  const canAct = apUsed < apLimit;

  if (gameState.status === 'LOST') {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-3xl text-red-500">Game Over</CardTitle>
            <CardDescription>You lived {gameState.turnIndex} weeks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {turnLogs.length > 0 && (
                <div className="text-sm p-3 bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-200 rounded-md">
                   {turnLogs[0].log.map((l, i) => <div key={i}>{l}</div>)}
                </div>
             )}
             <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Final Cash: ${(gameState.cash / 100).toFixed(2)}</div>
                <div>Final Job: {gameState.jobTier}</div>
             </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => { setGameState(null); setTurnLogs([]); }}>Start New Life</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-2 md:p-4 flex flex-col items-center">
        <div className="w-full max-w-[1200px] space-y-4">
          
          {/* Status Bar */}
          <Card>
            <CardContent className="p-3 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-x-2 gap-y-1 items-center text-sm">
              <StatWithTooltip 
                label="Week" 
                value={gameState.turnIndex + 1} 
                tooltip="Current game turn. Survive as long as you can." 
              />
              <StatWithTooltip 
                label={<>Cash <span className="text-[10px] block leading-tight">Exp: ${(gameState.expensesWeekly/100).toFixed(0)}</span></>} 
                value={`$${(gameState.cash / 100).toFixed(2)}`}
                tooltip="Your money. Keep it above $0. Weekly expenses are deducted each turn."
                valueClass={`font-bold text-lg ${gameState.cash < 0 ? 'text-red-500' : 'text-green-600'}`}
              />
              <div className="py-1">
                <div className="flex justify-between text-[11px] mb-[2px] text-muted-foreground w-full"><span>Health</span><span>{Math.round(gameState.health)}</span></div>
                <Progress value={gameState.health} className="h-2 [&>div]:bg-green-500" title="Health keeps you alive. Hit 0 and you lose." />
              </div>
              <div className="py-1">
                <div className="flex justify-between text-[11px] mb-[2px] text-muted-foreground w-full"><span>Stress</span><span>{Math.round(gameState.stress)}</span></div>
                <Progress value={gameState.stress} className="h-2 [&>div]:bg-red-500" title="High stress reduces max AP and increases chance of bad events." />
              </div>
              <div className="py-1">
                <div className="flex justify-between text-[11px] mb-[2px] text-muted-foreground w-full"><span>Happiness</span><span>{Math.round(gameState.happiness)}</span></div>
                <Progress value={gameState.happiness} className="h-2 [&>div]:bg-blue-500" title="Happiness buffers stress and improves outcomes." />
              </div>
              <StatWithTooltip 
                label="Job" 
                value={<Badge variant="outline" className="px-1 py-0">{gameState.jobTier}</Badge>} 
                tooltip="Your current job level. Influences wages and stress." 
                valueClass=""
              />
              <StatWithTooltip 
                label="Work Skill" 
                value={gameState.skills.workSkill} 
                tooltip="Promotions and better wage outcomes." 
              />
              <StatWithTooltip 
                label="Life Skill" 
                value={gameState.skills.lifeSkill} 
                tooltip="Improves life events and decisions." 
              />
              <StatWithTooltip 
                label="Reputation" 
                value={gameState.reputation} 
                tooltip="Helps with job hunting and social events." 
              />
              <StatWithTooltip 
                label="Tokens" 
                value={gameState.boostTokens} 
                tooltip="Premium currency (unused in v1)." 
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Main Play Area */}
            <div className="lg:col-span-3 flex flex-col space-y-4">
              
              {/* Most Recent Result - Prominent if exists */}
              {turnLogs.length > 0 && (
                 <Card className="bg-primary/5 border-primary/20 shadow-sm">
                   <CardContent className="p-3">
                     <div className="font-semibold text-sm mb-1 text-primary">Last Week ({turnLogs[0].week}) Results</div>
                     <div className="text-sm space-y-1">
                       {turnLogs[0].log.map((l, j) => <div key={j}>• {l}</div>)}
                     </div>
                   </CardContent>
                 </Card>
              )}

              {/* Action Allocator */}
              <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                  <div>
                    <CardTitle className="text-base">Plan Your Week</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground uppercase">AP Used</div>
                      <div className={`text-xl font-bold leading-none ${apUsed === apLimit ? 'text-green-600' : (apUsed > apLimit ? 'text-red-500' : '')}`}>
                        {apUsed} / {apLimit}
                      </div>
                    </div>
                    {apLimit > ACTION_POINTS_PER_WEEK && (
                      <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/30 animate-pulse">+1 Healthy</Badge>
                    )}
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(ACTION_DESCRIPTIONS).map(([key, info]) => {
                      const action = key as ActionType;
                      return (
                        <div key={action} className="flex flex-col justify-between p-2 rounded-md border bg-card hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-semibold text-sm leading-tight">
                              {info.name} 
                            </div>
                            {info.costStr !== 'Free' && <span className="text-[10px] text-muted-foreground font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{info.costStr}</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-tight mb-2 h-6">{info.desc}</div>
                          <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-1 rounded-md mt-auto">
                             <Button variant="outline" size="sm" className="h-6 w-8 p-0 shrink-0" 
                               onClick={() => handleActionChange(action, -1)} disabled={actions[action] <= 0}>-</Button>
                             <span className="font-medium text-sm w-4 text-center">{actions[action]}</span>
                             <Button variant="outline" size="sm" className="h-6 w-8 p-0 shrink-0" 
                               onClick={() => handleActionChange(action, 1)} disabled={!canAct}>+</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <Button 
                    className="w-full h-12 text-lg font-semibold" 
                    onClick={handleResolve}
                    disabled={apUsed === 0 || apUsed > apLimit}
                  >
                    Resolve Week
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Log Window (History) */}
            <Card className="flex flex-col h-[400px] lg:h-[calc(100vh-140px)] min-h-[300px]">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base text-muted-foreground flex items-center justify-between">
                  Life History
                  {turnLogs.length > 0 && <Badge variant="outline" className="text-xs font-normal">{turnLogs.length} weeks</Badge>}
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 p-0 relative">
                <ScrollArea className="h-full absolute inset-0 p-4">
                  {turnLogs.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center mt-10 italic">Your journey begins...</div>
                  ) : (
                    <div className="space-y-6">
                      {turnLogs.map((turn, i) => (
                        <div key={i} className="space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                          <div className="font-semibold text-xs flex items-center gap-2 text-muted-foreground">
                            W{turn.week}
                            <Separator className="flex-1" />
                          </div>
                          {turn.log.length > 0 && (
                            <ul className="text-xs list-disc pl-3 space-y-1">
                              {turn.log.map((l, j) => <li key={j}>{l}</li>)}
                            </ul>
                          )}
                          {turn.ledger.length > 0 && (
                            <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-[10px] space-y-1 mt-1 font-mono">
                              {turn.ledger.map((entry, j) => (
                                <div key={j} className="flex justify-between">
                                  <span className="opacity-70 truncate pr-2">{entry.reasonCode}</span>
                                  <span className={entry.delta >= 0 ? 'text-green-600' : 'text-red-500 shrink-0'}>
                                    {entry.delta > 0 ? '+' : '-'}${Math.abs(entry.delta / 100).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </TooltipProvider>
  );

  function startGame(scenario: ScenarioKey) {
    const s = getStartingState(scenario, Math.floor(Math.random() * 10000));
    setGameState(s);
    setTurnLogs([]);
    setActions({WORK: 0, STUDY_WORK: 0, STUDY_LIFE: 0, REST: 0, JOB_HUNT: 0, SIDE_GIG: 0, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 0});
  }

  function handleActionChange(action: ActionType, delta: number) {
    setActions(prev => ({
      ...prev,
      [action]: Math.max(0, prev[action] + delta)
    }));
  }

  function handleResolve() {
    if (!gameState) return;
    try {
      const { state, newLedgerEntries, log } = resolveTurn(gameState, { actions });
      setGameState({ ...state });
      setTurnLogs(prev => [{ week: state.turnIndex, log, ledger: newLedgerEntries }, ...prev]);
      
      // Auto-reset actions that we can't afford or reset fully
      setActions({WORK: 0, STUDY_WORK: 0, STUDY_LIFE: 0, REST: 0, JOB_HUNT: 0, SIDE_GIG: 0, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 0});
    } catch (e: any) {
      alert(e.message || 'Error resolving turn');
    }
  }
}

function ScenarioCard({ title, desc, onClick }: { title: string, desc: string, onClick: () => void }) {
  return (
    <Card className="hover:border-primary cursor-pointer transition-colors" onClick={onClick}>
      <CardHeader>
         <CardTitle>{title}</CardTitle>
         <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardFooter>
         <Button variant="secondary" className="w-full">Start Life</Button>
      </CardFooter>
    </Card>
  );
}
