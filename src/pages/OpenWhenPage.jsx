import React, { useEffect, useMemo, useState } from "react";
import { Heart, MailOpen, Plus, X, Search, Paperclip, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const PROMPTS = [
  ["💌", "Open when you miss me"],
  ["😊", "Open when you need a smile"],
  ["🌙", "Open when you cannot sleep"],
  ["🫂", "Open when you need a hug"],
  ["✨", "Open when you need motivation"],
  ["❤️", "Open when today is hard"],
  ["📸", "Open when you want to remember us"],
  ["🌷", "Open when you are proud of yourself"]
];

export const OpenWhenPage = () => {
  const [letters, setLetters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [emoji, setEmoji] = useState("💌");
  const [recipient, setRecipient] = useState("both");
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const result = await supabase.from("open_when_letters").select("*").order("created_at", { ascending: false });
    if (result.error) setError(result.error.message);
    else setLetters(result.data || []);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel("open-when-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "open_when_letters" }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return letters.filter((letter) => !q || (letter.title + " " + letter.content).toLowerCase().includes(q));
  }, [letters, query]);

  const createLetter = async (event) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Add a title and message.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const auth = await supabase.auth.getUser();
      const user = auth.data.user;
      if (!user) throw new Error("Please sign in first.");

      let media = [];
      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = user.id + "/" + Date.now() + "-" + crypto.randomUUID() + "-" + safe;
        const upload = await supabase.storage.from("time-capsule-media").upload(path, file, { upsert: false });
        if (upload.error) throw upload.error;
        const url = supabase.storage.from("time-capsule-media").getPublicUrl(path).data.publicUrl;
        media = [{ url: url, name: file.name, type: file.type || "application/octet-stream" }];
      }

      const insert = await supabase.from("open_when_letters").insert({
        title: title.trim(),
        content: content.trim(),
        emoji: emoji,
        recipient: recipient,
        media: media,
        author_id: user.id
      });
      if (insert.error) throw insert.error;

      setTitle("");
      setContent("");
      setEmoji("💌");
      setRecipient("both");
      setFile(null);
      setShowNew(false);
      await load();
    } catch (e) {
      setError(e.message || "Could not seal the letter.");
    } finally {
      setSaving(false);
    }
  };

  const media = (item) => {
    if (item.type && item.type.startsWith("image/")) return <img src={item.url} alt={item.name || "Attachment"} className="w-full max-h-[55vh] object-contain" />;
    if (item.type && item.type.startsWith("video/")) return <video controls src={item.url} className="w-full max-h-[55vh]" />;
    if (item.type && item.type.startsWith("audio/")) return <div className="p-5"><audio controls src={item.url} className="w-full" /></div>;
    return <a href={item.url} target="_blank" rel="noreferrer" className="block p-5 underline">{item.name || "Open attachment"}</a>;
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-950/40 px-4 py-2 text-xs text-rose-300"><MailOpen className="w-4 h-4" /> Sealed for a feeling</div>
          <h1 className="mt-5 font-serif text-5xl sm:text-7xl italic text-white">Open When…</h1>
          <p className="mt-4 text-sm sm:text-base text-rose-100/60">Little letters for the moments when you need something from us.</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setShowNew(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white"><Plus className="w-4 h-4" /> Seal a letter</button>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search envelopes…" className="rounded-full bg-white/5 border border-rose-200/10 py-3 pl-9 pr-4 text-sm text-white outline-none" /></div>
          </div>
        </div>

        {error && <div className="max-w-2xl mx-auto mt-7 rounded-2xl border border-rose-500/25 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</div>}

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((letter) => (
            <button key={letter.id} onClick={() => setSelected(letter)} className="group relative min-h-64 rounded-[2rem] overflow-hidden text-left border border-rose-200/10 bg-gradient-to-br from-[#fff8ec] to-[#ead8cf] p-6 shadow-xl hover:-translate-y-1 transition-all">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between"><span className="text-4xl">{letter.emoji || "💌"}</span><Sparkles className="w-4 h-4 text-[#8b5362]/40" /></div>
                <div className="mt-auto">
                  <div className="text-[9px] uppercase tracking-[.2em] text-[#8b5362]/70">Open when…</div>
                  <h2 className="mt-2 font-serif text-2xl text-[#35151e]">{letter.title}</h2>
                  <p className="mt-4 text-xs text-[#6f4b55]">{letter.recipient === "his" ? "For him" : letter.recipient === "her" ? "For her" : "For both of us"}</p>
                  <span className="mt-4 inline-flex text-[10px] uppercase tracking-[.18em] text-[#7a243c]">Open envelope →</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {!filtered.length && <div className="mt-12 rounded-[2rem] border border-rose-200/10 bg-black/15 p-14 text-center text-rose-100/50">No letters yet. Seal the first one. 💌</div>}

        {showNew && (
          <div className="fixed inset-0 z-50 bg-velvet-950/90 backdrop-blur-xl overflow-y-auto p-4 sm:p-8">
            <form onSubmit={createLetter} className="max-w-2xl mx-auto my-6 rounded-[2rem] bg-[#fff8ec] text-[#35151e] p-6 sm:p-9 shadow-2xl">
              <div className="flex justify-between">
                <div><div className="text-[10px] uppercase tracking-[.25em] text-[#8b5362]">Seal a moment</div><h2 className="font-serif text-4xl italic">Open When…</h2></div>
                <button type="button" onClick={() => setShowNew(false)}><X /></button>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {PROMPTS.map((prompt) => <button type="button" key={prompt[1]} onClick={() => { setEmoji(prompt[0]); setTitle(prompt[1]); }} className="rounded-full border border-[#a86b73]/20 bg-white/60 px-3 py-2 text-xs">{prompt[0]} {prompt[1].replace("Open when ", "")}</button>)}
              </div>
              <div className="mt-5 space-y-4">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Open when…" className="w-full rounded-2xl border border-[#a86b73]/20 bg-white/70 px-4 py-3 font-serif text-xl outline-none" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Write what they should hear…" className="w-full rounded-2xl border border-[#a86b73]/20 bg-white/70 px-4 py-3 outline-none resize-y" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="rounded-2xl border border-[#a86b73]/20 bg-white/60 p-3"><span className="block text-[10px] uppercase tracking-[.2em] text-[#8b5362] mb-2">Recipient</span><select value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full bg-transparent outline-none"><option value="both">Both of us</option><option value="his">Him</option><option value="her">Her</option></select></label>
                  <label className="rounded-2xl border border-[#a86b73]/20 bg-white/60 p-3"><span className="block text-[10px] uppercase tracking-[.2em] text-[#8b5362] mb-2">Envelope emoji</span><input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-full bg-transparent outline-none text-2xl" maxLength={4} /></label>
                </div>
                <label className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#a86b73]/25 bg-white/40 px-4 py-6 cursor-pointer"><Paperclip className="w-5 h-5" /><span className="text-sm">Attach photo, voice, video or file</span><input type="file" accept="image/*,audio/*,video/*,.pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" /></label>
                {file && <div className="text-xs text-[#8b5362]">{file.name}</div>}
              </div>
              <button disabled={saving} className="mt-7 w-full rounded-2xl bg-[#5a1c2c] text-white py-3 font-semibold">{saving ? "Sealing…" : "Seal this letter ❤️"}</button>
            </form>
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-[60] bg-[#14070c]/95 backdrop-blur-xl p-4 sm:p-8 overflow-y-auto" onClick={() => setSelected(null)}>
            <div className="max-w-3xl mx-auto min-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <article className="w-full rounded-[2rem] bg-[#fff8ec] text-[#35151e] shadow-2xl p-7 sm:p-12">
                <button onClick={() => setSelected(null)} className="ml-auto block w-10 h-10 rounded-full bg-[#5a1c2c]/10"><X className="mx-auto" /></button>
                <div className="text-center"><div className="text-6xl">{selected.emoji || "💌"}</div><div className="mt-4 text-[10px] uppercase tracking-[.3em] text-[#8b5362]">A letter for this moment</div><h2 className="mt-2 font-serif text-4xl sm:text-5xl italic">{selected.title}</h2></div>
                <div className="mt-8 h-px bg-[#a86b73]/20" />
                <p className="mt-8 whitespace-pre-wrap font-serif text-lg sm:text-xl leading-[1.9]">{selected.content}</p>
                {Array.isArray(selected.media) && selected.media.map((item, index) => <div key={index} className="mt-6 rounded-2xl overflow-hidden bg-[#f4e5d5]">{media(item)}</div>)}
              </article>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};