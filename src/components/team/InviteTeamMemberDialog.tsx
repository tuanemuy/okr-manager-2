"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { inviteToTeamAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inviteTeamMemberSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;

interface InviteTeamMemberDialogProps {
  teamId: string;
  children: React.ReactNode;
}

export function InviteTeamMemberDialog({
  teamId,
  children,
}: InviteTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<InviteTeamMemberInput>({
    resolver: zodResolver(inviteTeamMemberSchema) as any,
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const [formState, formAction, isPending] = useActionState(
    inviteToTeamAction,
    { input: { teamId, email: "", role: "member" }, error: null },
  );

  const onSubmit = (data: InviteTeamMemberInput) => {
    const formData = new FormData();
    formData.append("teamId", teamId);
    formData.append("email", data.email);
    formData.append("role", data.role);

    startTransition(() => {
      formAction(formData);
    });
  };

  // Close dialog on successful invitation
  if (formState.result && open) {
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>メンバーを招待</DialogTitle>
          <DialogDescription>
            チームに新しいメンバーを招待します。メールアドレスと役割を選択してください。
          </DialogDescription>
        </DialogHeader>

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

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>役割</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="役割を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="viewer">閲覧者</SelectItem>
                      <SelectItem value="member">メンバー</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formState.error && (
              <div className="text-red-600 text-sm">
                招待の送信に失敗しました。入力内容を確認してください。
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "送信中..." : "招待を送信"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
