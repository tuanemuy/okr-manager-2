"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { updateKeyResultAction } from "@/actions/okr";
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

const updateKeyResultSchema = z.object({
  title: z.string().min(1, "Key Resultタイトルを入力してください").optional(),
  description: z.string().optional(),
  targetValue: z.number().min(0, "目標値は0以上で入力してください").optional(),
  currentValue: z.number().min(0, "現在値は0以上で入力してください").optional(),
  unit: z.string().min(1, "単位を入力してください").optional(),
});

type UpdateKeyResultInput = z.infer<typeof updateKeyResultSchema>;

interface KeyResult {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  progress: number;
}

interface UpdateKeyResultDialogProps {
  keyResult: KeyResult;
  children: React.ReactNode;
}

export function UpdateKeyResultDialog({
  keyResult,
  children,
}: UpdateKeyResultDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateKeyResultInput>({
    resolver: zodResolver(updateKeyResultSchema),
    defaultValues: {
      title: keyResult.title,
      description: keyResult.description || "",
      targetValue: keyResult.targetValue,
      currentValue: keyResult.currentValue,
      unit: keyResult.unit || "",
    },
  });

  const [formState, formAction, isPending] = useActionState(
    updateKeyResultAction,
    {
      input: {
        id: keyResult.id,
        title: keyResult.title,
        description: keyResult.description,
        targetValue: keyResult.targetValue,
        currentValue: keyResult.currentValue,
        unit: keyResult.unit || "",
      },
      error: null,
    },
  );

  const onSubmit = (data: UpdateKeyResultInput) => {
    const formData = new FormData();
    formData.append("id", keyResult.id);
    if (data.title) {
      formData.append("title", data.title);
    }
    if (data.description !== undefined) {
      formData.append("description", data.description);
    }
    if (data.targetValue !== undefined) {
      formData.append("targetValue", data.targetValue.toString());
    }
    if (data.currentValue !== undefined) {
      formData.append("currentValue", data.currentValue.toString());
    }
    if (data.unit) {
      formData.append("unit", data.unit);
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Key Resultを更新</DialogTitle>
          <DialogDescription>
            Key Resultの内容や進捗を更新してください。
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

            <div className="grid grid-cols-3 gap-4">
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
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>現在値</FormLabel>
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
                    <FormLabel>単位</FormLabel>
                    <FormControl>
                      <Input placeholder="万円" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!!formState.error && (
              <div className="text-red-600 text-sm">
                Key Resultの更新に失敗しました。入力内容を確認してください。
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
