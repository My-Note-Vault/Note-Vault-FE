import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Gift, Loader2, Trophy } from "lucide-react";
import { fetchDrawOverview } from "@/api/draws";
import type { DrawCategory } from "@/types/draw";

const LABELS: Record<DrawCategory, { title: string; description: string }> = {
  NEW_MEMBER: { title: "오늘의 새 회원", description: "해당 날짜에 계정을 만든 회원" },
  DOCUMENT_WRITER: { title: "오늘의 작성자", description: "Document에 200자 이상 직접 입력한 회원" },
};

function winningProbability(count: number, participating: boolean) {
  const participantCount = Math.max(1, participating ? count : count + 1);
  return (100 / participantCount).toLocaleString(undefined, { maximumFractionDigits: 2 });
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary"><Trophy className="h-5 w-5" /><span className="text-sm font-medium">Daily Draw</span></div>
          <h1 className="text-3xl font-bold tracking-tight">매일 추첨 결과</h1>
          <p className="mt-2 text-sm text-muted-foreground">매일 00:00에 전날의 대상자 중 당첨자를 선정합니다.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.eligibleCounts.map((eligible) => (
            <div key={eligible.category} className="min-w-40 rounded-xl border bg-card px-5 py-3">
              <p className="text-xs text-muted-foreground">{LABELS[eligible.category].title} 조건 해당</p>
              <p className="mt-1 text-xl font-bold">{eligible.count.toLocaleString()}명</p>
              <p className="mt-1 text-xs text-muted-foreground">
                내가 참여한다면 당첨 확률 {winningProbability(eligible.count, eligible.participating)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {data.days.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center text-sm text-muted-foreground">아직 공개된 추첨 결과가 없습니다.</div>
      ) : data.days.map((day, index) => (
        <section key={day.drawDate} className={index === 0 ? "mb-10" : "mb-8"}>
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className={index === 0 ? "text-xl font-semibold" : "font-semibold"}>{day.drawDate}</h2>
            {index === 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">최신 결과</span>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {day.results.map((result) => {
              const label = LABELS[result.category];
              return (
                <article key={result.category} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div><h3 className="font-semibold">{label.title}</h3><p className="mt-1 text-xs text-muted-foreground">{label.description}</p></div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs">조건 해당 {result.eligibleCount.toLocaleString()}명</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-4">
                    <Gift className="h-6 w-6 text-primary" />
                    <div><p className="text-xs text-muted-foreground">당첨자</p><p className="text-lg font-bold">{result.winnerName ?? "대상자 없음"}</p></div>
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
