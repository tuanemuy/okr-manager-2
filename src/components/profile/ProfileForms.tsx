"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Save, User as UserIcon } from "lucide-react";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { changePasswordAction, updateProfileAction } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const updateProfileSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: z
      .string()
      .min(8, "新しいパスワードは8文字以上で入力してください"),
    confirmPassword: z.string().min(1, "パスワード確認を入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

interface User {
  id: string;
  name: string;
  email: string;
}

interface ProfileFormsProps {
  user: User;
}

export function ProfileForms({ user }: ProfileFormsProps) {
  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [profileState, profileAction, isProfilePending] = useActionState(
    updateProfileAction,
    { input: { name: user.name, email: user.email }, error: null },
  );

  const [passwordState, passwordAction, isPasswordPending] = useActionState(
    changePasswordAction,
    { input: { currentPassword: "", newPassword: "" }, error: null },
  );

  const onProfileSubmit = (data: UpdateProfileInput) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);

    startTransition(() => {
      profileAction(formData);
    });
  };

  const onPasswordSubmit = (data: ChangePasswordInput) => {
    const formData = new FormData();
    formData.append("currentPassword", data.currentPassword);
    formData.append("newPassword", data.newPassword);

    startTransition(() => {
      passwordAction(formData);
    });
  };

  // Reset password form on successful change
  if (passwordState.result) {
    passwordForm.reset();
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile">基本情報</TabsTrigger>
        <TabsTrigger value="password">パスワード変更</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span>基本情報</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>名前</FormLabel>
                      <FormControl>
                        <Input placeholder="田中太郎" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="example@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!!profileState.error && (
                  <div className="text-red-600 text-sm">
                    プロフィールの更新に失敗しました。入力内容を確認してください。
                  </div>
                )}

                {!!profileState.result && (
                  <div className="text-green-600 text-sm">
                    プロフィールを更新しました。
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isProfilePending}
                  className="w-full sm:w-auto"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isProfilePending ? "更新中..." : "変更を保存"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>パスワード変更</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>現在のパスワード</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="現在のパスワードを入力"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新しいパスワード</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="8文字以上の新しいパスワード"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>パスワード確認</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="新しいパスワードを再入力"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!!passwordState.error && (
                  <div className="text-red-600 text-sm">
                    パスワードの変更に失敗しました。入力内容を確認してください。
                  </div>
                )}

                {!!passwordState.result && (
                  <div className="text-green-600 text-sm">
                    パスワードを変更しました。
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isPasswordPending}
                  className="w-full sm:w-auto"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {isPasswordPending ? "変更中..." : "パスワードを変更"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
