import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const LIVE_KEY = 'live-journal-last-read-at';
const JOURNAL_KEY = 'normal-journal-last-read-at';

export const JournalUnreadBadges = () => {
  const [counts, setCounts] = useState({ journal: 0, live: 0 });

  // Keep the unread counters in sync with Supabase.
  useEffect(() => {
    let active = true;

    const getCounts = async () => {
      const [{ data: journals }, { data: live }] = await Promise.all([
        supabase.from('journal_entries').select('created_at').order('created_at', { ascending: true }),
        supabase.from('live_journal_messages').select('created_at').order('created_at', { ascending: true }),
      ]);

      if (!active) return;

      const journalAt = localStorage.getItem(JOURNAL_KEY);
      const liveAt = localStorage.getItem(LIVE_KEY);

      setCounts({
        journal: journalAt ? (journals || []).filter((item) => item.created_at > journalAt).length : 0,
        live: liveAt ? (live || []).filter((item) => item.created_at > liveAt).length : 0,
      });
    };

    getCounts();

    const journalChannel = supabase
      .channel('journal-unread-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'journal_entries' }, (payload) => {
        const lastRead = localStorage.getItem(JOURNAL_KEY);
        if (!lastRead || payload.new.created_at > lastRead) {
          setCounts((current) => ({ ...current, journal: current.journal + 1 }));
        }
      })
      .subscribe();

    const liveChannel = supabase
      .channel('live-unread-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_journal_messages' }, (payload) => {
        const lastRead = localStorage.getItem(LIVE_KEY);
        if (!lastRead || payload.new.created_at > lastRead) {
          setCounts((current) => ({ ...current, live: current.live + 1 }));
        }
      })
      .subscribe();

    const timer = window.setInterval(getCounts, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
      supabase.removeChannel(journalChannel);
      supabase.removeChannel(liveChannel);
    };
  }, []);

  // Update the two book buttons without observing the DOM continuously.
  // The old MutationObserver watched its own badge text changes, which created
  // an endless mutation loop and could lock the entire page when Journal opened.
  useEffect(() => {
    const updateBadges = () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const journalButton = buttons.find((button) => button.textContent?.includes('Our Journal'));
      const liveButton = buttons.find((button) => button.textContent?.includes('Live Journal'));

      const updateBadge = (button, count, type) => {
        if (!button) return;

        button.style.position = 'relative';
        let badge = button.querySelector(`[data-journal-unread="${type}"]`);

        if (!badge) {
          badge = document.createElement('span');
          badge.setAttribute('data-journal-unread', type);
          badge.className = 'journal-unread-badge';
          badge.setAttribute('aria-label', `${count} unread ${type === 'live' ? 'Live Journal messages' : 'journal entries'}`);
          button.appendChild(badge);
        }

        const nextText = count > 99 ? '99+' : String(count);
        if (badge.textContent !== nextText) badge.textContent = nextText;
        badge.style.display = count > 0 ? 'flex' : 'none';
      };

      updateBadge(journalButton, counts.journal, 'journal');
      updateBadge(liveButton, counts.live, 'live');
    };

    // The book buttons are rendered by JournalPage. Run after React has painted.
    const frame = window.requestAnimationFrame(updateBadges);
    return () => window.cancelAnimationFrame(frame);
  }, [counts]);

  // Mark a book as read when it is opened. This listener does not modify the DOM.
  useEffect(() => {
    const onClick = (event) => {
      const button = event.target.closest?.('button');
      if (!button) return;

      const text = button.textContent || '';
      const now = new Date().toISOString();

      if (text.includes('Our Journal')) {
        localStorage.setItem(JOURNAL_KEY, now);
        setCounts((current) => ({ ...current, journal: 0 }));
      } else if (text.includes('Live Journal')) {
        localStorage.setItem(LIVE_KEY, now);
        setCounts((current) => ({ ...current, live: 0 }));
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return (
    <style>{`
      .journal-unread-badge {
        position: absolute;
        right: -10px;
        top: -10px;
        z-index: 50;
        min-width: 40px;
        height: 40px;
        padding: 0 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        background: #fff3df;
        color: #7a243c;
        font: 700 12px/1 system-ui, sans-serif;
        border: 2px solid rgba(253,164,175,.55);
        box-shadow: 0 0 18px rgba(251,113,133,.65), 0 7px 20px rgba(0,0,0,.35);
        pointer-events: none;
        animation: journalBadgePulse 2s ease-in-out infinite;
      }

      @keyframes journalBadgePulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 14px rgba(251,113,133,.5), 0 7px 20px rgba(0,0,0,.35);
        }
        50% {
          transform: scale(1.07);
          box-shadow: 0 0 25px rgba(251,113,133,.8), 0 7px 20px rgba(0,0,0,.35);
        }
      }
    `}</style>
  );
};
