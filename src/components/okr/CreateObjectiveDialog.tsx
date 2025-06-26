"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { createObjectiveAction } from "@/actions/okr";
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
import { Textarea } from "@/components/ui/textarea";

const createObjectiveSchema = z.object({
  title: z.string().min(1, "目標タイトルを入力してください"),
  description: z.string().optional(),
  type: z.enum(["personal", "team", "organization"]),
  teamId: z.string().uuid().optional(),
  startDate: z.string().min(1, "開始日を選択してください"),
  endDate: z.string().min(1, "終了日を選択してください"),
});

type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;

interface CreateObjectiveDialogProps {
  children: React.ReactNode;
}

export function CreateObjectiveDialog({
  children,
}: CreateObjectiveDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateObjectiveInput>({
    resolver: zodResolver(createObjectiveSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      type: "personal",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 3 months from now
    },
  });

  const [formState, formAction, isPending] = useActionState(
    createObjectiveAction,
    {
      input: {
        title: "",
        description: "",
        type: "personal",
        startDate: "",
        endDate: "",
      },
      error: null,
    },
  );

  const onSubmit = (data: CreateObjectiveInput) => {
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.description) {
      formData.append("description", data.description);
    }
    formData.append("type", data.type);
    if (data.teamId) {
      formData.append("teamId", data.teamId);
    }
    formData.append("startDate", data.startDate);
    formData.append("endDate", data.endDate);

    startTransition(() => {
      formAction(formData);
    });
  };

  // Close dialog on successful creation
  if (formState.result && open) {
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>新しいOKRを作成</DialogTitle>
          <DialogDescription>
            目標（Objective）を設定してください。後でKey Resultsを追加できます。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>目標タイトル</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="四半期の売上目標を達成する"
                      {...field}
                    />
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
                      placeholder="目標の詳細説明を入力してください"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OKRの種類</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="種類を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="personal">個人OKR</SelectItem>
                      <SelectItem value="team">チームOKR</SelectItem>
                      <SelectItem value="organization">組織OKR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>終了日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {formState.error && (
              <div className="text-red-600 text-sm">
                OKRの作成に失敗しました。入力内容を確認してください。
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
                {isPending ? "作成中..." : "作成"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
