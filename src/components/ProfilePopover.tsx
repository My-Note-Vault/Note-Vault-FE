import { useRef, useState, useEffect } from "react";
import { Controller, useForm, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Camera, User, LogOut, Trash2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMemberProfile,
  useProfileImage,
  useUpdateMemberProfile,
  useUploadProfileImage,
  usePayoutAccount,
  useDeletePayoutAccount,
} from "@/hooks/useMember";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const createProfileSchema = (t: (key: string) => string) => z.object({
  nickname: z
    .string()
    .trim()
    .min(1, t("profile.nicknameRequired"))
    .max(20, t("profile.nicknameMax"))
    .refine((value) => !value.includes("#"), t("profile.nicknameHash")),
  dayStartHour: z.number().min(0).max(23),
  dayStartMinute: z.number().min(0).max(59),
});

type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>;

function normalizeProfileDefaults(profile?: {
  nickname?: string | null;
  dayStartTime?: {
    hour?: number | null;
    minute?: number | null;
  } | null;
} | null): ProfileFormValues {
  return {
    nickname: profile?.nickname ?? "",
    dayStartHour:
      typeof profile?.dayStartTime?.hour === "number" ? profile.dayStartTime.hour : 6,
    dayStartMinute:
      typeof profile?.dayStartTime?.minute === "number" ? profile.dayStartTime.minute : 0,
  };
}

export default function ProfilePopover() {
  const { t, i18n } = useTranslation();
  const profileSchema = createProfileSchema(t);
  const { logout } = useAuth();
  const { data: profile } = useMemberProfile();
  const { data: profileImage } = useProfileImage();
  const updateProfile = useUpdateMemberProfile();
  const uploadImage = useUploadProfileImage();
  const { data: payoutAccount } = usePayoutAccount();
  const deletePayoutAccount = useDeletePayoutAccount();

  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: normalizeProfileDefaults(profile),
  });

  useEffect(() => {
    if (profile) {
      reset(normalizeProfileDefaults(profile));
    }
  }, [profile, reset]);

  useEffect(() => {
    setPreviewUrl(profileImage?.profileImageUrl ?? null);
  }, [profileImage]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setUploadProgress(0);
      await uploadImage.mutateAsync({
        file,
        onProgress: setUploadProgress,
      });
    } catch {
      toast.error(t("profile.uploadFailed"));
    } finally {
      setUploadProgress(null);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync({
        nickname: values.nickname,
        dayStartHour: values.dayStartHour,
        dayStartMinute: values.dayStartMinute,
      });
      toast.success(t("profile.updated"));
      setOpen(false);
    } catch {
      toast.error(t("profile.saveFailed"));
    }
  };

  const onInvalid: SubmitErrorHandler<ProfileFormValues> = (formErrors) => {
    if (formErrors.nickname?.message) {
      toast.error(formErrors.nickname.message);
      return;
    }

    toast.error(t("profile.checkInput"));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && profile) {
      reset(normalizeProfileDefaults(profile));
    }
    if (!nextOpen) {
      setPreviewUrl(profileImage?.profileImageUrl ?? null);
    }
  };

  const avatarSrc = previewUrl ?? undefined;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
          title={t("profile.title")}
        >
          <Avatar className="h-7 w-7">
            {profileImage?.profileImageUrl ? (
              <AvatarImage src={profileImage.profileImageUrl} alt={t("profile.imageAlt")} />
            ) : null}
            <AvatarFallback className="bg-muted text-xs">
              <User className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent side="right" align="end" className="w-72 p-0">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-4 space-y-4">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
            >
              <Avatar className="h-16 w-16">
                {avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt={t("profile.imageAlt")} />
                ) : null}
                <AvatarFallback className="bg-muted">
                  <User className="h-7 w-7 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity ${
                  uploadImage.isPending ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {uploadImage.isPending ? (
                  <span className="text-xs font-medium text-white">
                    {uploadProgress ?? 0}%
                  </span>
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </div>
            </button>
            {uploadImage.isPending && (
              <span className="text-xs text-muted-foreground">
                {t("profile.uploading", { progress: uploadProgress ?? 0 })}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* 로그아웃 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("profile.logout")}
          </Button>

          {/* 이름 (읽기 전용) */}
          {profile?.name && (
            <div className="space-y-1">
              <Label htmlFor="popover-name" className="text-xs">{t("profile.name")}</Label>
              <Input
                id="popover-name"
                value={profile.name}
                disabled
                className="disabled:opacity-70"
              />
            </div>
          )}

          {profile?.memberTag && (
            <div className="space-y-1">
              <Label htmlFor="popover-member-tag" className="text-xs">{t("profile.memberTag")}</Label>
              <Input
                id="popover-member-tag"
                value={`#${profile.memberTag}`}
                disabled
                className="disabled:opacity-70"
              />
            </div>
          )}

          {payoutAccount?.configured && (
            <div className="space-y-1">
              <Label className="text-xs">{t("profile.payoutAccount")}</Label>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-md border border-input bg-muted/50 px-3 py-2">
                  <p className="truncate text-sm">
                    {payoutAccount.bankName} {payoutAccount.maskedAccountNumber}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive"
                  disabled={deletePayoutAccount.isPending}
                  title={t("profile.deletePayout")}
                  onClick={async () => {
                    if (!window.confirm(t("profile.confirmDeletePayout"))) return;
                    try {
                      await deletePayoutAccount.mutateAsync();
                      toast.success(t("profile.payoutDeleted"));
                    } catch {
                      toast.error(t("profile.payoutDeleteFailed"));
                    }
                  }}
                >
                  {deletePayoutAccount.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* 닉네임 */}
          <div className="space-y-1">
            <Label htmlFor="popover-nickname" className="text-xs">{t("profile.nickname")}</Label>
            <Input
              id="popover-nickname"
              placeholder={t("profile.nicknamePlaceholder")}
              {...register("nickname")}
            />
            {errors.nickname && (
              <p className="text-xs text-destructive">
                {errors.nickname.message}
              </p>
            )}
          </div>

          {/* 하루 시작 시간 */}
          <div className="space-y-1">
            <Label className="text-xs">{t("profile.dayStart")}</Label>
            <div className="flex gap-2">
              <Controller
                name="dayStartHour"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t("profile.selectHour")}>
                        {t("profile.hour", { value: Number(field.value ?? 6) })}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {t("profile.hour", { value: i })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <Controller
                name="dayStartMinute"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t("profile.selectMinute")}>
                        {t("profile.minute", { value: String(Number(field.value ?? 0)).padStart(2, "0") })}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 15, 30, 45].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {t("profile.minute", { value: String(m).padStart(2, "0") })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {(errors.dayStartHour || errors.dayStartMinute) && (
              <p className="text-xs text-destructive">
                {t("profile.invalidDayStart")}
              </p>
            )}
          </div>

          {/* 저장 버튼 */}
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              t("common.save")
            )}
          </Button>

          <div className="space-y-1">
            <Label className="text-xs">{t("language.label")}</Label>
            <Select value={i18n.resolvedLanguage?.startsWith("ko") ? "ko" : "en"} onValueChange={(value) => void i18n.changeLanguage(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">{t("language.korean")}</SelectItem>
                <SelectItem value="en">{t("language.english")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
