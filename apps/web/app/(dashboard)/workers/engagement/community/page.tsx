'use client';

import { useState } from 'react';

import { Skeleton, EmptyState } from '@/components/ui';
import { Card } from '@/components/ui/card.js';
import { usePosts, useCreatePost, useCreateComment, useLikePost } from '@/modules/engagement/store.js';
import { MessageSquare, Heart, Send } from 'lucide-react';

export default function CommunityPage() {
  const [filter, setFilter] = useState('');
  const { data: posts, isLoading } = usePosts({ postType: filter || undefined, limit: '50' });
  const { mutateAsync: createPost } = useCreatePost();
  const { mutateAsync: createComment } = useCreateComment();
  const { mutateAsync: likePost } = useLikePost();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Community Hub</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Share ideas, success stories, and connect with colleagues</p>
      </div>

      <div className="flex gap-2">
        {['', 'discussion', 'idea', 'success_story'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-md border px-3 py-1.5 text-xs capitalize ${filter === f ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'border-[rgb(var(--border-color))]'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(posts ?? []).length === 0 && <EmptyState title="No posts" description="Start a conversation or share an idea." />}
          {(posts ?? []).map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium">{post.title}</h3>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))] line-clamp-2">{post.body}</p>
                </div>
                <span className="rounded-full bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs">{post.postType}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-[rgb(var(--muted))]">
                <button onClick={() => likePost(post.id)} className="flex items-center gap-1 hover:text-red-500">
                  <Heart className="h-3 w-3" /> {post.likesCount}
                </button>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {post.commentsCount}</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
