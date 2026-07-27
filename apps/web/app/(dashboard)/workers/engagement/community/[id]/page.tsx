'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState } from '@/components/ui';
import { Button } from '@/components/ui/button.js';
import { usePost, useComments, useCreateComment, useLikePost } from '@/modules/engagement/store.js';
import { Heart, Send } from 'lucide-react';
import Link from 'next/link';

export default function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [postId, setPostId] = useState('');

  if (!resolvedParams && params instanceof Promise) {
    params.then((p) => { setResolvedParams(p); setPostId(p.id); });
  }

  const currentId = resolvedParams?.id ?? postId;
  const { data: post, isLoading } = usePost(currentId);
  const { data: comments, isLoading: commentsLoading } = useComments(currentId);
  const { mutateAsync: createComment } = useCreateComment();
  const { mutateAsync: likePost } = useLikePost();
  const [body, setBody] = useState('');

  if (isLoading) return <div className="mx-auto max-w-3xl"><Skeleton className="h-64 w-full" /></div>;
  if (!post) return <EmptyState title="Post not found" description="This post may have been removed." />;

  const handleSubmit = async () => {
    if (!body.trim()) return;
    await createComment({ postId: post.id, data: { body } });
    setBody('');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/workers/engagement/community"><button className="rounded-md border border-[rgb(var(--border-color))] px-3 py-1.5 text-xs hover:bg-[rgb(var(--panel-2))]">← Back to Community</button></Link>

      <Card className="p-6">
        <h1 className="text-lg font-semibold">{post.title}</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">{post.body}</p>
      </Card>

      <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted))]">
        <button onClick={() => likePost(post.id)} className="flex items-center gap-1 hover:text-red-500">
          <Heart className="h-4 w-4" /> {post.likesCount}
        </button>
        <span>Comments: {post.commentsCount}</span>
      </div>

      <Card className="p-4 space-y-4">
        <h2 className="text-sm font-semibold">Comments</h2>
        {commentsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (comments ?? []).length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {(comments ?? []).map((c) => (
              <div key={c.id} className="rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3 text-sm">
                <p>{c.body}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{c.userId.slice(0, 8)} · {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input value={body} onChange={(e) => setBody(e.target.value)} className="flex-1 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--input-bg))] px-3 py-2 text-sm" placeholder="Add a comment..." />
          <Button size="sm" onClick={handleSubmit}><Send className="h-4 w-4" /></Button>
        </div>
      </Card>
    </div>
  );
}
