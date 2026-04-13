import { useRef, useState, useEffect } from "react";
import { Controller, useForm, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Camera, User } from "lucide-react";
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
} from "@/hooks/useMember";

const profileSchema = z.object({
  nickname: z.string().min(1, "닉네임을 입력해 주세요"),
  dayStartHour: z.number().min(0).max(23),
  dayStartMinute: z.number().min(0).max(59),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function normalizeProfileDefaults(profile?: {
  nickname?: string | null;
  dayStartHour?: number | null;
  dayStartMinute?: number | null;
} | null): ProfileFormValues {
  return {
    nickname: profile?.nickname ?? "",
    dayStartHour:
      typeof profile?.dayStartHour === "number" ? profile.dayStartHour : 6,
    dayStartMinute:
      typeof profile?.dayStartMinute === "number" ? profile.dayStartMinute : 0,
  };
}

export default function ProfilePopover() {
  const { data: profile } = useMemberProfile();
  const { data: profileImage } = useProfileImage();
  const updateProfile = useUpdateMemberProfile();
  const uploadImage = useUploadProfileImage();

  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      await uploadImage.mutateAsync({ file });
    } catch {
      toast.error("이미지 업로드에 실패했습니다");
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync({
        nickname: values.nickname,
        dayStartHour: values.dayStartHour,
        dayStartMinute: values.dayStartMinute,
      });
      toast.success("프로필이 수정되었습니다");
      setOpen(false);
    } catch {
      toast.error("프로필 저장에 실패했습니다");
    }
  };

  const onInvalid: SubmitErrorHandler<ProfileFormValues> = (formErrors) => {
    if (formErrors.nickname?.message) {
      toast.error(formErrors.nickname.message);
      return;
    }

    toast.error("프로필 정보를 다시 확인해 주세요");
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
          title="프로필"
        >
          <Avatar className="h-7 w-7">
            {profileImage?.profileImageUrl ? (
              <AvatarImage src={profileImage.profileImageUrl} alt="프로필" />
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
                  <AvatarImage src={avatarSrc} alt="프로필" />
                ) : null}
                <AvatarFallback className="bg-muted">
                  <User className="h-7 w-7 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadImage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* 이름 (읽기 전용) */}
          {profile?.name && (
            <div className="space-y-1">
              <Label htmlFor="popover-name" className="text-xs">이름</Label>
              <Input
                id="popover-name"
                value={profile.name}
                disabled
                className="disabled:opacity-70"
              />
            </div>
          )}

          {/* 닉네임 */}
          <div className="space-y-1">
            <Label htmlFor="popover-nickname" className="text-xs">닉네임</Label>
            <Input
              id="popover-nickname"
              placeholder="닉네임을 입력하세요"
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
            <Label className="text-xs">하루 시작 시간</Label>
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
                      <SelectValue placeholder="시 선택">
                        {`${Number(field.value ?? 6)}시`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {i}시
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
                      <SelectValue placeholder="분 선택">
                        {`${String(Number(field.value ?? 0)).padStart(2, "0")}분`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 15, 30, 45].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {String(m).padStart(2, "0")}분
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {(errors.dayStartHour || errors.dayStartMinute) && (
              <p className="text-xs text-destructive">
                하루 시작 시간을 다시 선택해 주세요.
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
              "저장"
            )}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
