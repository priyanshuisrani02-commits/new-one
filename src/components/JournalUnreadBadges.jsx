import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const LIVE_KEY = 'live-journal-last-read-at';
const JOURNAL_KEY = 'normal-journal-last-read-at';

export const JournalUnreadBadges = () => {
  const [counts, setCounts] = useState({ journal: 0, live: 0 });

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
        journal: journalAt ? (journals || []).filter(x => x.created_at > journalAt).length : 0,
        live: liveAt ? (live || []).filter(x => x.created_at > liveAt).length : 0,
      });
    };

    getCounts();
    const journalChannel = supabase.channel('journal-unread-badge').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'journal_entries' }, payload => {
      if (localStorage.getItem(JOURNAL_KEY) !== payload.new.id && localStorage.getItem(JOURNAL_KEY) !== payload.new.created_at) setCounts(c => ({ ...c, journal: c.journal + 1 }));
    }).subscribe();
    const liveChannel = supabase.channel('live-unread-badge').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_journal_messages' }, payload => {
      if (localStorage.getItem(LIVE_KEY) !== payload.new.created_at) setCounts(c => ({ ...c, live: c.live + 1 }));
    }).subscribe();

    const timer = setInterval(getCounts, 15000);
    return () => { active = false; clearInterval(timer); supabase.removeChannel(journalChannel); supabase.removeChannel(liveChannel); };
  }, []);

  useEffect(() => {
    const decorate = () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const journal = buttons.find(b => b.textContent?.includes('Our Journal'));
      const live = buttons.find(b => b.textContent?.includes('Live Journal'));
      const add = (button, count, type) => {
        if (!button) return;
        button.style.position = 'relative';
        let badge = button.querySelector('[data-journal-unread]');
        if (!badge) { badge = document.createElement('span'); badge.setAttribute('data-journal-unread', type); badge.className = 'journal-unread-badge'; button.appendChild(badge); }
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = count > 0 ? 'flex' : 'none';
      };
      add(journal, counts.journal, 'journal');
      add(live, counts.live, 'live');
    };
    decorate();
    const observer = new MutationObserver(decorate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [counts]);

  useEffect(() => {
    const onClick = event => {
      const button = event.target.closest?.('button');
      if (!button) return;
      const text = button.textContent || '';
      if (text.includes('Our Journal')) {
        const now = new Date().toISOString();
        localStorage.setItem(JOURNAL_KEY, now);
        setCounts(c => ({ ...c, journal: 0 }));
      } else if (text.includes('Live Journal')) {
        const now = new Date().toISOString();
        localStorage.setItem(LIVE_KEY, now);
        setCounts(c => ({ ...c, live: 0 }));
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return <style>{`.journal-unread-badge{position:absolute;right:-10px;top:-10px;z-index:50;min-width:40px;height:40px;padding:0 9px;align-items:center;justify-content:center;border-radius:9999px;background:#fff3df;color:#7a243c;font:700 12px/1 system-ui,sans-serif;border:2px solid rgba(253,164,175,.55);box-shadow:0 0 18px rgba(251,113,133,.65),0 7px 20px rgba(0,0,0,.35);pointer-events:none;animation:journalBadgePulse 2s ease-in-out infinite}@keyframes journalBadgePulse{0%,100%{transform:scale(1);box-shadow:0 0 14px rgba(251,113,133,.5),0 7px 20px rgba(0,0,0,.35)}50%{transform:scale(1.07);box-shadow:0 0 25px rgba(251,113,133,.8),0 7px 20px rgba(0,0,0,.35)}}`}</style>;
};
