"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { createKeyResultAction } from "@/actions/okr";
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

const createKeyResultSchema = z.object({
  title: z.string().min(1, "Key Resultタイトルを入力してください"),
  description: z.string().optional(),
  type: z.enum(["percentage", "number", "boolean"]),
  targetValue: z.number().min(0, "目標値は0以上で入力してください"),
  unit: z.string().optional(),
  startDate: z.string().min(1, "開始日を選択してください"),
  endDate: z.string().min(1, "終了日を選択してください"),
});

type CreateKeyResultInput = z.infer<typeof createKeyResultSchema>;

interface CreateKeyResultDialogProps {
  objectiveId: string;
  children: React.ReactNode;
}

export function CreateKeyResultDialog({
  objectiveId,
  children,
}: CreateKeyResultDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateKeyResultInput>({
    resolver: zodResolver(createKeyResultSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      type: "number" as const,
      targetValue: 100,
      unit: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  });

  const [formState, formAction, isPending] = useActionState(
    createKeyResultAction,
    {
      input: {
        objectiveId,
        title: "",
        description: "",
        type: "number",
        targetValue: 100,
        unit: "",
        startDate: "",
        endDate: "",
      },
      error: null,
    },
  );

  const onSubmit = (data: CreateKeyResultInput) => {
    const formData = new FormData();
    formData.append("objectiveId", objectiveId);
    formData.append("title", data.title);
    if (data.description) {
      formData.append("description", data.description);
    }
    formData.append("type", data.type);
    formData.append("targetValue", data.targetValue.toString());
    if (data.unit) {
      formData.append("unit", data.unit);
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
          <DialogTitle>Key Resultを追加</DialogTitle>
          <DialogDescription>
            測定可能な具体的な結果を設定してください。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Resultタイトル</FormLabel>
                  <FormControl>
                    <Input placeholder="月間売上を1000万円にする" {...field} />
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
                      placeholder="Key Resultの詳細説明を入力してください"
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
                  <FormLabel>Key Resultの種類</FormLabel>
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
                      <SelectItem value="number">数値</SelectItem>
                      <SelectItem value="percentage">パーセンテージ</SelectItem>
                      <SelectItem value="boolean">達成/未達成</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目標値</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>単位（任意）</FormLabel>
                    <FormControl>
                      <Input placeholder="万円" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                Key Resultの作成に失敗しました。入力内容を確認してください。
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
