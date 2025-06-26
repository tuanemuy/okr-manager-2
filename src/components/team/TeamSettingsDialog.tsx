"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { updateTeamAction } from "@/actions/team";
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
import { Textarea } from "@/components/ui/textarea";

const updateTeamSchema = z.object({
  name: z.string().min(1, "チーム名を入力してください"),
  description: z.string().optional(),
});

type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface TeamSettingsDialogProps {
  team: Team;
  children: React.ReactNode;
}

export function TeamSettingsDialog({
  team,
  children,
}: TeamSettingsDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateTeamInput>({
    resolver: zodResolver(updateTeamSchema) as any,
    defaultValues: {
      name: team.name,
      description: team.description || "",
    },
  });

  const [formState, formAction, isPending] = useActionState(updateTeamAction, {
    input: { id: team.id, name: team.name, description: team.description },
    error: null,
  });

  const onSubmit = (data: UpdateTeamInput) => {
    const formData = new FormData();
    formData.append("id", team.id);
    formData.append("name", data.name);
    if (data.description) {
      formData.append("description", data.description);
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  // Close dialog on successful update
  if (formState.result && open) {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>チーム設定</DialogTitle>
          <DialogDescription>チームの基本情報を編集します。</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>チーム名</FormLabel>
                  <FormControl>
                    <Input placeholder="開発チーム" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="チームの説明を入力してください"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formState.error && (
              <div className="text-red-600 text-sm">
                チーム情報の更新に失敗しました。入力内容を確認してください。
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
                {isPending ? "更新中..." : "更新"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
