"use client";
import React, { useState } from 'react';
import { GameState, ScenarioKey, ActionType, getStartingState, resolveTurn, ACTION_POINTS_PER_WEEK, LedgerEntry, getNetWorth, getMilestones, ASSET_CATALOG, purchaseAsset, BUSINESS_INCOME_BY_TIER, BUSINESS_SKILL_REQ } from '@lifeos/engine';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Trophy, ShoppingBag, Check, Lock } from 'lucide-react';

const fmt$ = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const CATEGORY_ORDER = ['HOUSING', 'TRANSPORT', 'LEISURE', 'LIFESTYLE'] as const;
const CATEGORY_LABEL: Record<string, string> = { HOUSING: '🏠 Housing', TRANSPORT: '🚗 Transport', LEISURE: '✈️ Leisure', LIFESTYLE: '💪 Lifestyle' };

function assetEffectSummary(effects: any): string {
  if (!effects) return '';
  const parts: string[] = [];
  if (typeof effects.expensesWeeklyDelta === 'number' && effects.expensesWeeklyDelta < 0)
    parts.push(`−${fmt$(-effects.expensesWeeklyDelta)}/wk expenses`);
  if (typeof effects.statusValue === 'number' && effects.statusValue > 0)
    parts.push(`+${fmt$(effects.statusValue)} net worth`);
  if (typeof effects.happinessPerTurn === 'number' && effects.happinessPerTurn > 0)
    parts.push(`+${effects.happinessPerTurn} happiness/wk`);
  if (typeof effects.stressPerTurnDelta === 'number' && effects.stressPerTurnDelta < 0)
    parts.push(`${effects.stressPerTurnDelta} stress/wk`);
  if (typeof effects.eventBadWeightMultiplier === 'number' && effects.eventBadWeightMultiplier < 1)
    parts.push('fewer bad-luck events');
  return parts.join(' · ');
}

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
  BUILD_BUSINESS: { name: 'Build Business', desc: 'Grow your business (needs SENIOR + high Work Skill + cash)', costStr: 'Invest' },
};

function StatWithTooltip({ label, value, tooltip, valueClass = "font-bold text-lg" }: { label: React.ReactNode, value: React.ReactNode, tooltip: string, valueClass?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="text-left">
        <div className="cursor-help text-left">
          <div className="text-[10px] text-muted-foreground whitespace-nowrap leading-tight">{label}</div>
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
    WORK: 0, STUDY_WORK: 0, STUDY_LIFE: 0, REST: 0, JOB_HUNT: 0, SIDE_GIG: 0, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 0, BUILD_BUSINESS: 0
  });

  const [turnLogs, setTurnLogs] = useState<{ week: number, log: string[], ledger: LedgerEntry[] }[]>([]);
  const [buyOpen, setBuyOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  const milestones = getMilestones(gameState);
  const milestonesDone = milestones.filter(m => m.done).length;
  const milestonesTotal = milestones.length;

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
      <div
        className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center px-2 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)', paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
      >
        <div className="w-full max-w-[1100px] space-y-2">

          {/* ===== WON celebration (open-ended) ===== */}
          {gameState.status === 'WON' && (
            <div className="rounded-md bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border border-amber-400/50 px-3 py-2 text-center">
              <div className="text-base font-bold text-amber-500">🏆 Millionaire!</div>
              <div className="text-[11px] text-muted-foreground">You hit $1M net worth — you won. It&apos;s open-ended, so keep building.</div>
            </div>
          )}

          {/* ===== Stat Dashboard (dense) ===== */}
          <Card>
            <CardContent className="p-2 space-y-2">
              {/* Row 1: key numbers */}
              <div className="grid grid-cols-4 gap-x-2 gap-y-1">
                <StatWithTooltip label="Week" value={gameState.turnIndex + 1} valueClass="font-bold text-base leading-tight"
                  tooltip="Current game turn." />
                <StatWithTooltip
                  label={<>Cash <span className="text-[9px] opacity-70">exp ${(gameState.expensesWeekly/100).toFixed(0)}/wk</span></>}
                  value={`$${(gameState.cash / 100).toFixed(0)}`}
                  tooltip="Your money. Keep it above $0. Weekly expenses are deducted each turn."
                  valueClass={`font-bold text-base leading-tight ${gameState.cash < 0 ? 'text-red-500' : 'text-green-600'}`} />
                <StatWithTooltip label="Job" value={<Badge variant="outline" className="px-1 py-0 text-[11px]">{gameState.jobTier}</Badge>}
                  tooltip="Your current job level. Influences wages and stress." valueClass="" />
                <StatWithTooltip label="Net Worth"
                  value={fmt$(getNetWorth(gameState))}
                  tooltip="Cash + property/asset value + business equity. This is the score you're chasing — aim for $1M."
                  valueClass="font-bold text-base leading-tight text-amber-500" />
              </div>

              {/* Row 2: skills */}
              <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                <StatWithTooltip label="Work Skill" value={gameState.skills.workSkill} valueClass="font-bold text-base leading-tight"
                  tooltip="Drives promotions and better wages." />
                <StatWithTooltip label="Life Skill" value={gameState.skills.lifeSkill} valueClass="font-bold text-base leading-tight"
                  tooltip="Improves life events and decisions." />
                <StatWithTooltip label="Reputation" value={gameState.reputation} valueClass="font-bold text-base leading-tight"
                  tooltip="Helps with job hunting and social events." />
              </div>

              {/* Row 3: thin bars, 3 across */}
              <div className="grid grid-cols-3 gap-2">
                <div title="Health keeps you alive. Hit 0 and you lose.">
                  <div className="flex justify-between text-[10px] mb-[2px] text-muted-foreground"><span>Health</span><span>{Math.round(gameState.health)}</span></div>
                  <Progress value={gameState.health} className="h-1.5 [&>div]:bg-green-500" />
                </div>
                <div title="High stress harms health, income, and triggers bad events.">
                  <div className="flex justify-between text-[10px] mb-[2px] text-muted-foreground"><span>Stress</span><span>{Math.round(gameState.stress)}</span></div>
                  <Progress value={gameState.stress} className="h-1.5 [&>div]:bg-red-500" />
                </div>
                <div title="Happiness buffers stress and improves outcomes.">
                  <div className="flex justify-between text-[10px] mb-[2px] text-muted-foreground"><span>Happy</span><span>{Math.round(gameState.happiness)}</span></div>
                  <Progress value={gameState.happiness} className="h-1.5 [&>div]:bg-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== Buy + Goals bar ===== */}
          <div className="grid grid-cols-2 gap-2">
            <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
              <DialogTrigger render={<Button variant="outline" className="h-9 text-sm font-medium"><ShoppingBag className="h-4 w-4 mr-1" /> Buy</Button>} />
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Spend Your Money</DialogTitle>
                  <DialogDescription>Buy assets to grow net worth and unlock perks. Buying does <b>not</b> use action points.</DialogDescription>
                </DialogHeader>
                {renderBuyList()}
              </DialogContent>
            </Dialog>

            <Dialog open={goalsOpen} onOpenChange={setGoalsOpen}>
              <DialogTrigger render={
                <Button variant="outline" className="h-9 text-sm font-medium">
                  <Trophy className="h-4 w-4 mr-1" /> Goals
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">{milestonesDone}/{milestonesTotal}</Badge>
                </Button>
              } />
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Goals & Business</DialogTitle>
                  <DialogDescription>Milestones to chase and your business empire.</DialogDescription>
                </DialogHeader>
                {renderBusinessPanel()}
                {renderMilestones()}
              </DialogContent>
            </Dialog>
          </div>

          {/* ===== Last week result strip ===== */}
          {(notice || (turnLogs.length > 0 && turnLogs[0].log.length > 0)) && (
            <div className="rounded-md bg-primary/5 border border-primary/20 px-2 py-1 text-[11px] leading-snug">
              {notice ? (
                <span className="font-semibold text-amber-500">{notice}</span>
              ) : (
                <>
                  <span className="font-semibold text-primary">W{turnLogs[0].week}: </span>
                  {turnLogs[0].log.join(' · ')}
                </>
              )}
            </div>
          )}

          {/* ===== Plan Your Week (actions) ===== */}
          <Card className="flex flex-col">
            <div className="flex flex-row items-center justify-between py-2 px-3">
              <CardTitle className="text-sm">Plan Your Week</CardTitle>
              <div className="flex items-center gap-2">
                {apLimit > ACTION_POINTS_PER_WEEK && (
                  <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/30 text-[10px] px-1.5 py-0">+1 Healthy</Badge>
                )}
                <div className="text-right leading-none">
                  <span className="text-[10px] text-muted-foreground uppercase mr-1">AP</span>
                  <span className={`text-lg font-bold ${apUsed === apLimit ? 'text-green-600' : (apUsed > apLimit ? 'text-red-500' : '')}`}>
                    {apUsed}/{apLimit}
                  </span>
                </div>
              </div>
            </div>
            <Separator />
            <CardContent className="p-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {Object.entries(ACTION_DESCRIPTIONS).map(([key, info]) => {
                  const action = key as ActionType;
                  const active = actions[action] > 0;
                  return (
                    <div key={action}
                      title={info.desc}
                      className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-md border transition-colors ${active ? 'border-primary/50 bg-primary/5' : 'bg-card'}`}>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[13px] leading-tight truncate">{info.name}</div>
                        {info.costStr !== 'Free' && <div className="text-[9px] text-muted-foreground leading-none">{info.costStr}</div>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0"
                          onClick={() => handleActionChange(action, -1)} disabled={actions[action] <= 0}>−</Button>
                        <span className="font-semibold text-sm w-3 text-center">{actions[action]}</span>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0"
                          onClick={() => handleActionChange(action, 1)} disabled={!canAct}>+</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <div className="p-2 pt-0">
              <Button
                className="w-full h-11 text-base font-semibold"
                onClick={handleResolve}
                disabled={apUsed === 0 || apUsed > apLimit}
              >
                Resolve Week
              </Button>
            </div>
          </Card>

          {/* ===== Life History (below the fold) ===== */}
          <Card className="flex flex-col">
            <div className="py-2 px-3 flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Life History</CardTitle>
              {turnLogs.length > 0 && <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">{turnLogs.length} weeks</Badge>}
            </div>
            <Separator />
            <CardContent className="p-0">
              <ScrollArea className="h-[40vh] p-3">
                {turnLogs.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center mt-6 italic">Your journey begins...</div>
                ) : (
                  <div className="space-y-4">
                    {turnLogs.map((turn, i) => (
                      <div key={i} className="space-y-1 opacity-80">
                        <div className="font-semibold text-xs flex items-center gap-2 text-muted-foreground">
                          W{turn.week}
                          <Separator className="flex-1" />
                        </div>
                        {turn.log.length > 0 && (
                          <ul className="text-xs list-disc pl-3 space-y-0.5">
                            {turn.log.map((l, j) => <li key={j}>{l}</li>)}
                          </ul>
                        )}
                        {turn.ledger.length > 0 && (
                          <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-[10px] space-y-0.5 mt-1 font-mono">
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
    </TooltipProvider>
  );

  function handleBuy(assetId: string, name: string) {
    if (!gameState) return;
    const res = purchaseAsset(gameState, assetId);
    if (res.ok) {
      setGameState({ ...gameState });
      setNotice(`Bought ${name}! ${res.log ?? ''}`.trim());
    } else {
      setNotice(`Couldn't buy ${name}: ${res.error ?? 'not available'}`);
    }
  }

  function renderBuyList() {
    if (!gameState) return null;
    const owned = gameState.assets || [];
    return (
      <div className="space-y-3">
        {CATEGORY_ORDER.map(cat => {
          const items = ASSET_CATALOG.filter(a => a.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground">{CATEGORY_LABEL[cat] ?? cat}</div>
              {items.map(a => {
                const isOwned = owned.includes(a.id);
                const missingPrereqs = (a as any).requires?.filter((r: string) => !owned.includes(r)) ?? [];
                const prereqOk = missingPrereqs.length === 0;
                const affordable = gameState.cash >= a.cost;
                const canBuy = !isOwned && prereqOk && affordable;
                const prereqNames = missingPrereqs
                  .map((r: string) => ASSET_CATALOG.find(c => c.id === r)?.name ?? r)
                  .join(', ');
                return (
                  <div key={a.id} className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 ${isOwned ? 'bg-green-500/5 border-green-500/30' : 'bg-card'}`}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium leading-tight flex items-center gap-1">
                        {a.name}
                        {isOwned && <Check className="h-3 w-3 text-green-500 shrink-0" />}
                        {!isOwned && !prereqOk && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">{assetEffectSummary((a as any).effects)}</div>
                      {!isOwned && !prereqOk && <div className="text-[10px] text-amber-500 leading-tight">Requires: {prereqNames}</div>}
                    </div>
                    <div className="shrink-0 text-right">
                      {isOwned ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-green-600">Owned</Badge>
                      ) : (
                        <Button size="sm" className="h-7 px-2 text-xs" disabled={!canBuy}
                          onClick={() => handleBuy(a.id, a.name)}>
                          <span className={affordable ? '' : 'opacity-60'}>{fmt$(a.cost)}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  function renderBusinessPanel() {
    if (!gameState) return null;
    const tier = (gameState.businessTier || 'NONE') as keyof typeof BUSINESS_INCOME_BY_TIER;
    const income = (BUSINESS_INCOME_BY_TIER as any)[tier] ?? 0;
    const req = (BUSINESS_SKILL_REQ as any)[tier];
    const tierLabel: Record<string, string> = { NONE: 'No business yet', SIDE_BUSINESS: 'Side Business', BUSINESS: 'Business', ENTERPRISE: 'Enterprise' };
    const ready = req && gameState.skills.workSkill >= req.skill && gameState.jobTier === 'SENIOR' && gameState.cash >= req.cost;
    return (
      <div className="rounded-md border p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">💼 {tierLabel[tier]}</div>
          {income > 0 && <Badge variant="secondary" className="text-[10px] text-green-600">+{fmt$(income)}/wk passive</Badge>}
        </div>
        {req ? (
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <div>Next: <b>{tierLabel[req.next] ?? req.next}</b> — needs Work Skill <b>{req.skill}</b> (you have {gameState.skills.workSkill}), SENIOR job, and <b>{fmt$(req.cost)}</b> cash.</div>
            {ready
              ? <div className="text-green-600 font-medium">✅ Ready! Use the <b>Build Business</b> action this week to level up.</div>
              : <div>Keep studying & saving, then use the <b>Build Business</b> action.</div>}
          </div>
        ) : (
          <div className="text-[11px] text-green-600">Maxed out — banking {fmt$(income)}/wk. 🏆</div>
        )}
      </div>
    );
  }

  function renderMilestones() {
    return (
      <div className="space-y-1 mt-2">
        <div className="text-xs font-semibold text-muted-foreground">Milestones · {milestonesDone}/{milestonesTotal}</div>
        {milestones.map(m => (
          <div key={m.id} className="flex items-center gap-2 text-[13px]">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] shrink-0 ${m.done ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
              {m.done ? '✓' : ''}
            </span>
            <span className={m.done ? 'line-through text-muted-foreground' : ''}>{m.name}</span>
          </div>
        ))}
      </div>
    );
  }

  function startGame(scenario: ScenarioKey) {
    const s = getStartingState(scenario, Math.floor(Math.random() * 10000));
    setGameState(s);
    setTurnLogs([]);
    setNotice(null);
    setActions({WORK: 0, STUDY_WORK: 0, STUDY_LIFE: 0, REST: 0, JOB_HUNT: 0, SIDE_GIG: 0, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 0, BUILD_BUSINESS: 0});
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
      setNotice(null);
      setTurnLogs(prev => [{ week: state.turnIndex, log, ledger: newLedgerEntries }, ...prev]);
      
      // Auto-reset actions that we can't afford or reset fully
      setActions({WORK: 0, STUDY_WORK: 0, STUDY_LIFE: 0, REST: 0, JOB_HUNT: 0, SIDE_GIG: 0, EAT_HEALTHY: 0, WORK_OUT: 0, HAVE_FUN: 0, BUILD_BUSINESS: 0});
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
