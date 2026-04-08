import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMemberProfile,
  useUpdateMemberProfile,
  useUploadProfileImage,
} from "@/hooks/useMember";


const profileSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(20, "닉네임은 20자 이하여야 합니다"),
  dayStartHour: z.number().min(0).max(23),
  dayStartMinute: z.number().min(0).max(59),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const { data: profile } = useMemberProfile();
  const updateProfile = useUpdateMemberProfile();
  const uploadImage = useUploadProfileImage();

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile?.profileImageUrl ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: profile?.nickname ?? "",
      dayStartHour: profile?.dayStartHour ?? 6,
      dayStartMinute: profile?.dayStartMinute ?? 0,
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        nickname: profile.nickname ?? "",
        dayStartHour: profile.dayStartHour,
        dayStartMinute: profile.dayStartMinute,
      });
      setPreviewUrl(profile.profileImageUrl ?? null);
    }
  }, [profile, reset]);

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
      setPreviewUrl(null);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync({
        nickname: values.nickname,
        dayStartHour: values.dayStartHour,
        dayStartMinute: values.dayStartMinute,
      });
      toast.success("프로필이 설정되었습니다");
      navigate("/app", { replace: true });
    } catch {
      toast.error("프로필 저장에 실패했습니다");
    }
  };

  const avatarSrc = previewUrl ?? undefined;
  const isSubmitting = updateProfile.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm border border-border rounded-xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">프로필 설정</h1>
          <p className="text-sm text-muted-foreground">
            서비스를 시작하기 전에 프로필을 설정해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
            >
              <Avatar className="h-24 w-24">
                {avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt="프로필" />
                ) : null}
                <AvatarFallback className="bg-muted">
                  <User className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadImage.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
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
            <span className="text-xs text-muted-foreground">
              클릭하여 이미지 업로드
            </span>
          </div>

          {/* 닉네임 */}
          <div className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
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
          <div className="space-y-2">
            <Label>하루 시작 시간</Label>
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
                      <SelectValue />
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
                      <SelectValue />
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
          </div>

          {/* 제출 */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || uploadImage.isPending}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              "시작하기"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
