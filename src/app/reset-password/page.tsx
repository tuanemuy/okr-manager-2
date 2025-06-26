"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { requestPasswordResetAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const resetSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

type ResetInput = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const form = useForm<ResetInput>({
    resolver: zodResolver(resetSchema) as any,
    defaultValues: {
      email: "",
    },
  });

  const [formState, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    { input: { email: "" }, error: null },
  );

  const onSubmit = (data: ResetInput) => {
    const formData = new FormData();
    formData.append("email", data.email);

    startTransition(() => {
      formAction(formData);
    });
  };

  if (formState.result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">
              送信完了
            </CardTitle>
            <CardDescription>
              パスワードリセットメールを送信しました
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              メールを確認して、パスワードリセットの手順に従ってください。
            </p>
            <Link href="/login">
              <Button className="w-full">ログインページへ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            パスワードリセット
          </CardTitle>
          <CardDescription>
            メールアドレスを入力してリセットリンクを受け取ってください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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

              {formState.error && (
                <div className="text-red-600 text-sm">
                  メール送信に失敗しました。メールアドレスを確認してください。
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "送信中..." : "リセットリンクを送信"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ログインページに戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
