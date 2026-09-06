import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Gift, Loader2, Trophy } from "lucide-react";
import { fetchDrawOverview } from "@/api/draws";
import type { DrawCategory } from "@/types/draw";

const LABELS: Record<DrawCategory, { title: string; description: string }> = {
  NEW_MEMBER: { title: "새 회원", description: "해당 날짜에 계정을 만든 회원" },
  DOCUMENT_WRITER: { title: "100자 이상 작성", description: "Workspace의 Task 또는 Note에 100자 이상 직접 입력한 회원" },
};

function winningProbability(count: number, participating: boolean) {
  const participantCount = Math.max(1, participating ? count : count + 1);
  return (100 / participantCount).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function resultWinningProbability(count: number) {
  if (count === 0) return "0";
  return (100 / count).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function DrawResultsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["daily-draws"],
    queryFn: fetchDrawOverview,
  });

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (isError || !data) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">추첨 결과를 불러오지 못했습니다.</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary"><Trophy className="h-5 w-5" /><span className="text-sm font-medium">Daily Draw</span></div>
          <h1 className="text-3xl font-bold tracking-tight">매일 추첨 결과</h1>
          <p className="mt-2 text-sm text-muted-foreground">매일 00:00에 전날의 대상자 중 당첨자를 선정합니다.</p>
        </div>
      </div>

      <section className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Today</p>
          <h2 className="mt-1 text-lg font-semibold">오늘의 참여 현황</h2>
          <p className="mt-1 text-xs text-muted-foreground">오늘 자정까지 집계되며, 내일 결과가 공개됩니다.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data.eligibleCounts.map((eligible) => (
            <div key={eligible.category} className="rounded-xl border bg-card px-5 py-4">
              <p className="text-sm font-medium">{LABELS[eligible.category].title}</p>
              <p className="mt-1 text-xl font-bold">{eligible.count.toLocaleString()}명</p>
              <p className="mt-1 text-xs text-muted-foreground">
                내가 참여한다면 당첨 확률 {winningProbability(eligible.count, eligible.participating)}%
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-4 border-b pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Published Results</p>
        <h2 className="mt-1 text-xl font-semibold">공개된 추첨 결과</h2>
        <p className="mt-1 text-xs text-muted-foreground">가장 최근에 공개된 전날 결과부터 표시합니다.</p>
      </div>

      {data.days.map((day, index) => (
        <section key={day.drawDate} className={index === 0 ? "mb-10" : "mb-8"}>
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className={index === 0 ? "text-xl font-semibold" : "font-semibold"}>{day.drawDate}</h2>
            {index === 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">전날 결과</span>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {day.results.map((result) => {
              const label = LABELS[result.category];
              return (
                <article key={result.category} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div><h3 className="font-semibold">{label.title}</h3><p className="mt-1 text-xs text-muted-foreground">{label.description}</p></div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs">참여자 {result.eligibleCount.toLocaleString()}명</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-4">
                    <Gift className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">당첨자</p>
                      <p className="text-lg font-bold">{result.winnerName ?? "당첨자 없음"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        참여자 {result.eligibleCount.toLocaleString()}명 · 당첨 확률 {resultWinningProbability(result.eligibleCount)}%
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
