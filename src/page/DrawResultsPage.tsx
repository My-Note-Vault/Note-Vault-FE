import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AlertTriangle, CalendarDays, Gift, Landmark, Loader2, Trophy } from "lucide-react";
import { fetchDrawOverview } from "@/api/draws";
import type { DrawCategory } from "@/types/draw";
import type { BankCode, PayoutAccountVerification } from "@/types/member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  usePayoutAccount,
  useSaveVerifiedPayoutAccount,
  useVerifyPayoutAccount,
} from "@/hooks/useMember";

const LABELS: Record<DrawCategory, { title: string; description: string }> = {
  NEW_MEMBER: { title: "새 회원", description: "해당 날짜에 계정을 만든 회원" },
  DOCUMENT_WRITER: { title: "100자 이상 작성", description: "Workspace의 Task 또는 Note에 100자 이상 직접 입력한 회원" },
};

const BANKS: Array<{ code: BankCode; name: string }> = [
  { code: "KB", name: "국민은행" },
  { code: "SHINHAN", name: "신한은행" },
  { code: "HANA", name: "하나은행" },
  { code: "KAKAO", name: "카카오뱅크" },
  { code: "TOSS", name: "토스뱅크" },
  { code: "K_BANK", name: "케이뱅크" },
];

function winningProbability(count: number, participating: boolean) {
  const participantCount = Math.max(1, participating ? count : count + 1);
  return (100 / participantCount).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function resultWinningProbability(count: number) {
  if (count === 0) return "0";
  return (100 / count).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function PayoutAccountSection() {
  const [isEditing, setIsEditing] = useState(false);
  const [bankCode, setBankCode] = useState<BankCode | "">("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verification, setVerification] = useState<PayoutAccountVerification | null>(null);
  const { data: account, isLoading } = usePayoutAccount();
  const verifyAccount = useVerifyPayoutAccount();
  const saveAccount = useSaveVerifiedPayoutAccount();

  useEffect(() => {
    if (account?.bankCode && !bankCode) {
      setBankCode(account.bankCode);
    }
  }, [account?.bankCode, bankCode]);

  const showForm = !account?.verified || isEditing;
  const errorMessage = (error: unknown, fallback: string) => {
    const message = axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message
      : null;
    return message ?? fallback;
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = accountNumber.replace(/-/g, "");
    if (!bankCode) {
      toast.error("은행을 선택해 주세요.");
      return;
    }
    if (!/^\d{6,14}$/.test(normalized)) {
      toast.error("계좌번호는 숫자 6~14자리로 입력해 주세요.");
      return;
    }
    try {
      const result = await verifyAccount.mutateAsync({ bankCode, accountNumber: normalized });
      setVerification(result);
      toast.success("계좌 인증이 완료되었습니다. 저장을 눌러 등록을 마쳐 주세요.");
    } catch (error) {
      setVerification(null);
      toast.error(errorMessage(error, "계좌 인증에 실패했습니다."));
    }
  };

  const handleSave = async () => {
    if (!verification) return;
    try {
      await saveAccount.mutateAsync(verification.verificationToken);
      setVerification(null);
      setAccountNumber("");
      setIsEditing(false);
      toast.success("송금 계좌가 저장되었습니다.");
    } catch (error) {
      toast.error(errorMessage(error, "계좌 저장에 실패했습니다."));
    }
  };

  return (
    <section className="mb-8 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <Landmark className="mt-0.5 h-5 w-5 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">송금받을 계좌</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            당첨금 지급에 사용할 본인 계좌를 등록해 주세요.
          </p>

          {!isLoading && !account?.verified && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {account?.configured
                  ? "등록된 계좌가 아직 인증되지 않았습니다. 계좌를 다시 확인해 주세요."
                  : "송금받을 계좌가 등록되지 않았습니다. 당첨금 지급을 위해 계좌를 입력해 주세요."}
              </p>
            </div>
          )}

          {account?.verified && !showForm && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{account.bankName} · 인증 완료</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{account.maskedAccountNumber}</p>
                {account.maskedHolderName && (
                  <p className="mt-0.5 text-xs text-muted-foreground">예금주 {account.maskedHolderName}</p>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                setBankCode(account.bankCode ?? "");
                setVerification(null);
                setAccountNumber("");
                setIsEditing(true);
              }}>
                변경
              </Button>
            </div>
          )}

          {showForm && !isLoading && (
            <form onSubmit={handleVerify} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="payout-bank">은행</Label>
                <Select value={bankCode} onValueChange={(value) => {
                  setBankCode(value as BankCode);
                  setVerification(null);
                }}>
                  <SelectTrigger id="payout-bank"><SelectValue placeholder="은행 선택" /></SelectTrigger>
                  <SelectContent>
                    {BANKS.map((bank) => <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payout-account-number">계좌번호</Label>
                <Input
                  id="payout-account-number"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="숫자만 입력"
                  value={accountNumber}
                  onChange={(event) => {
                    setAccountNumber(event.target.value.replace(/[^0-9-]/g, ""));
                    setVerification(null);
                  }}
                />
              </div>
              <div className="flex gap-2">
                {account?.verified && <Button type="button" variant="ghost" onClick={() => {
                  setVerification(null);
                  setIsEditing(false);
                }}>취소</Button>}
                <Button type="submit" variant="outline" disabled={verifyAccount.isPending}>
                  {verifyAccount.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "계좌 인증"}
                </Button>
              </div>
              </div>

              {verification && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">계좌 인증 완료</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {verification.bankName} · {verification.maskedAccountNumber} · 예금주 {verification.maskedHolderName}
                    </p>
                  </div>
                  <Button type="button" onClick={handleSave} disabled={saveAccount.isPending}>
                    {saveAccount.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "저장"}
                  </Button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
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

      <PayoutAccountSection />

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
                {eligible.participating ? "내 당첨 확률" : "내가 참여한다면 당첨 확률"}{" "}
                {winningProbability(eligible.count, eligible.participating)}%
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-4 border-b pb-3">
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
