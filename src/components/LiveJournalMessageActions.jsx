import React, { useEffect, useMemo, useState } from 'react';
import { CornerUpLeft, Send, X, SmilePlus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const REACTIONS = ['❤️', '😂', '🥹', '👍', '✨', '🫶'];

export const LiveJournalMessageActions = ({ message, userId, messages, reactions: reactionRows = [], onSent, onReactionRefresh }) => {
  const [reactions, setReactions] = useState(reactionRows);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [reactionError, setReactionError] = useState('');

  useEffect(() => {
    setReactions(reactionRows);
  }, [reactionRows]);

  const loadReactions = async () => {
    const { data } = await supabase
      .from('live_journal_reactions')
      .select('id,message_id,user_id,emoji')
      .eq('message_id', message.id);
    if (data) setReactions(data);
  };

  const grouped = useMemo(
    () =>
      REACTIONS.map((emoji) => ({
        emoji,
        count: reactions.filter((reaction) => reaction.emoji === emoji).length,
        mine: reactions.some(
          (reaction) => reaction.emoji === emoji && reaction.user_id === userId,
        ),
      })).filter((reaction) => reaction.count > 0),
    [reactions, userId],
  );

  const toggleReaction = async (emoji) => {
    if (!userId || busy) return;
    setBusy(true);
    setReactionError('');

    const existing = reactions.find(
      (reaction) => reaction.emoji === emoji && reaction.user_id === userId,
    );

    try {
      if (existing) {
        setReactions((prev) => prev.filter((reaction) => reaction.id !== existing.id));
        const { error } = await supabase.from('live_journal_reactions').delete().eq('id', existing.id);
        if (error) throw error;
      } else {
        const optimistic = { id: `pending-${crypto.randomUUID()}`, message_id: message.id, user_id: userId, emoji };
        setReactions((prev) => [...prev, optimistic]);
        const { data, error } = await supabase.from('live_journal_reactions').insert({
          message_id: message.id,
          user_id: userId,
          emoji,
        }).select('id,message_id,user_id,emoji').single();
        if (error) throw error;
        setReactions((prev) => prev.map((reaction) => reaction.id === optimistic.id ? data : reaction));
      }
      onReactionRefresh?.();
      setReactionOpen(false);
    } catch (error) {
      setReactionError(error?.message || 'Could not update reaction.');
      await loadReactions();
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    const content = replyText.trim();
    if (!content || !userId || busy) return;

    setBusy(true);
    const { data, error } = await supabase
      .from('live_journal_messages')
      .insert({ content, author_id: userId, reply_to_id: message.id })
      .select('*')
      .single();

    if (!error && data) {
      setReplyText('');
      setReplying(false);
      onSent?.(data);
    }

    setBusy(false);
  };

  const parent = message.reply_to_id
    ? messages.find((item) => item.id === message.reply_to_id)
    : null;

  return (
    <>
      {parent && (
        <div className="mb-2 rounded-xl border-l-2 border-[#a86b73]/40 bg-black/5 px-3 py-2 text-xs text-[#8b5362]">
          <div className="flex items-center gap-1 font-semibold">
            <CornerUpLeft className="w-3 h-3" /> Replying to a message
          </div>
          <div className="mt-0.5 line-clamp-2 opacity-80">{parent.content}</div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {grouped.map(({ emoji, count, mine }) => (
          <button
            key={emoji}
            type="button"
            onClick={() => toggleReaction(emoji)}
            className={`rounded-full px-2 py-1 text-xs border transition-all ${
              mine
                ? 'bg-[#f4dbe2] border-[#8b5362]/50'
                : 'bg-white/45 border-[#a86b73]/20'
            }`}
            aria-label={`React ${emoji}`}
          >
            {emoji} {count}
          </button>
        ))}

        <div className="relative">
          <button
            type="button"
            onClick={() => setReactionOpen((value) => !value)}
            aria-expanded={reactionOpen}
            aria-label="Add reaction"
            disabled={busy}
            className="w-8 h-8 rounded-full border border-[#a86b73]/20 bg-white/45 hover:bg-white/70 text-base transition-all disabled:opacity-40"
          >
            <SmilePlus className="w-4 h-4 mx-auto text-[#8b5362]" />
          </button>
          {reactionOpen && (
            <div
              className={`absolute bottom-[calc(100%+10px)] z-40 flex w-max max-w-[calc(100vw-2rem)] ${message.author_id === userId ? 'right-0' : 'left-0'}`} items-center gap-1.5 rounded-full border border-[#a86b73]/25 bg-[#fff8ec]/98 px-2 py-2 shadow-[0_12px_35px_rgba(53,21,30,.25)] backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => toggleReaction(emoji)}
                  disabled={busy}
                  className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full text-xl sm:text-2xl hover:bg-[#f4dbe2] active:scale-90 transition-transform disabled:opacity-40"
                  aria-label={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setReplying((value) => !value)}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-[#8b5362] hover:bg-black/5 transition-colors"
        >
          {replying ? <X className="w-3 h-3" /> : <CornerUpLeft className="w-3 h-3" />}
          {replying ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {reactionError && <div className="mt-1 text-[10px] text-red-500/80">{reactionError}</div>}

      {replying && (
        <form onSubmit={sendReply} className="mt-2 flex gap-1.5">
          <input
            autoFocus
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder="Reply to this message…"
            maxLength={5000}
            className="min-w-0 flex-1 rounded-xl border border-[#a86b73]/25 bg-white/65 px-3 py-2 text-sm outline-none focus:border-[#8b5362]/50"
          />
          <button
            type="submit"
            disabled={!replyText.trim() || busy}
            className="w-9 rounded-xl bg-[#5a1c2c] text-white disabled:opacity-40"
            aria-label="Send reply"
          >
            <Send className="w-4 h-4 mx-auto" />
          </button>
        </form>
      )}
    </>
  );
};
