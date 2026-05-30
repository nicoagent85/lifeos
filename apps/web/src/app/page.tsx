"use client";
import React, { useState } from 'react';
import { GameState, ScenarioKey, ActionType, getStartingState, resolveTurn, ACTION_POINTS_PER_WEEK, LedgerEntry } from '@lifeos/engine';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-6">
        
        {/* Status Bar */}
        <Card>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-center text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Week</div>
              <div className="font-bold text-lg">{gameState.turnIndex + 1}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cash (Weekly exp: ${(gameState.expensesWeekly/100).toFixed(0)})</div>
              <div className={`font-bold text-lg ${gameState.cash < 0 ? 'text-red-500' : 'text-green-600'}`}>
                ${(gameState.cash / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span>Health</span><span>{Math.round(gameState.health)}</span></div>
              <Progress value={gameState.health} className="[&>div]:bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span>Stress</span><span>{Math.round(gameState.stress)}</span></div>
              <Progress value={gameState.stress} className="[&>div]:bg-red-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span>Happiness</span><span>{Math.round(gameState.happiness)}</span></div>
              <Progress value={gameState.happiness} className="[&>div]:bg-blue-500" />
            </div>
            <div>
               <div className="text-xs text-muted-foreground">Job</div>
               <Badge variant="outline">{gameState.jobTier}</Badge>
            </div>
            <div>
               <div className="text-xs text-muted-foreground">Work Skill</div>
               <div className="font-bold text-lg">{gameState.skills.workSkill}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Allocator */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Plan Your Week</CardTitle>
                <CardDescription>Allocate your time and energy.</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Action Points</div>
                <div className={`text-2xl font-bold ${apUsed === apLimit ? 'text-green-600' : (apUsed > apLimit ? 'text-red-500' : '')}`}>
                  {apUsed} / {apLimit}
                </div>
                {apLimit > ACTION_POINTS_PER_WEEK && (
                  <div className="text-xs text-green-600 mt-1 uppercase tracking-wider font-semibold animate-pulse">+1 Healthy Bonus</div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 pt-4">
              {Object.entries(ACTION_DESCRIPTIONS).map(([key, info]) => {
                const action = key as ActionType;
                return (
                  <div key={action} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {info.name} 
                        {info.costStr !== 'Free' && <Badge variant="secondary" className="text-xs font-normal">{info.costStr}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{info.desc}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" 
                        onClick={() => handleActionChange(action, -1)} disabled={actions[action] <= 0}>-</Button>
                      <span className="w-4 text-center font-medium">{actions[action]}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" 
                        onClick={() => handleActionChange(action, 1)} disabled={!canAct}>+</Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                className="w-full h-14 text-lg" 
                size="lg"
                onClick={handleResolve}
                disabled={apUsed === 0}
              >
                Resolve Week
              </Button>
            </CardFooter>
          </Card>

          {/* Log Window */}
          <Card className="flex flex-col h-[600px] lg:h-auto">
            <CardHeader>
              <CardTitle>Life History</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative">
              <ScrollArea className="h-full absolute inset-0 p-6">
                {turnLogs.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center mt-10 italic">Your journey begins...</div>
                ) : (
                  <div className="space-y-6">
                    {turnLogs.map((turn, i) => (
                      <div key={i} className="space-y-2">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          Week {turn.week}
                          <Separator className="flex-1" />
                        </div>
                        {turn.log.length > 0 && (
                          <ul className="text-sm list-disc pl-4 space-y-1 text-muted-foreground">
                            {turn.log.map((l, j) => <li key={j}>{l}</li>)}
                          </ul>
                        )}
                        {turn.ledger.length > 0 && (
                          <div className="bg-zinc-100 dark:bg-zinc-900 rounded p-2 text-xs space-y-1 mt-2 font-mono">
                            {turn.ledger.map((entry, j) => (
                              <div key={j} className="flex justify-between">
                                <span className="opacity-70">{entry.reasonCode}</span>
                                <span className={entry.delta >= 0 ? 'text-green-600' : 'text-red-500'}>
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
