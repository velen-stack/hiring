"use client";

import { useRef, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Comment, User, CommentSource } from "@prisma/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { addComment, deleteComment } from "@/app/(app)/candidates/[id]/comments/actions";

type CommentWithAuthor = Comment & {
  author: Pick<User, "id" | "name" | "image">;
};

export function CommentThread({
  candidateId,
  currentUserId,
  comments,
}: {
  candidateId: string;
  currentUserId: string;
  comments: CommentWithAuthor[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <form
        ref={formRef}
        action={(fd) =>
          start(async () => {
            await addComment(candidateId, fd);
            formRef.current?.reset();
          })
        }
        className="rounded-lg border bg-white p-4"
      >
        <Textarea
          name="body"
          required
          rows={3}
          placeholder="Add your thoughts… (who you spoke with, signals, concerns)"
        />
        <div className="mt-3 flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Posting…" : "Post comment"}
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-slate-50 p-6 text-center text-sm text-muted-foreground">
          No comments yet. Get the conversation started.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start gap-3">
                <Avatar name={c.author.name} image={c.author.image} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{c.author.name ?? "Someone"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </p>
                    {c.source === ("SLACK" as CommentSource) ? (
                      <Badge className="border-violet-200 bg-violet-50 text-violet-700">
                        from Slack
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm">{c.body}</p>
                </div>
                {c.authorId === currentUserId ? (
                  <button
                    onClick={() => start(async () => deleteComment(c.id))}
                    disabled={pending}
                    className="text-xs text-muted-foreground hover:text-rose-600"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
