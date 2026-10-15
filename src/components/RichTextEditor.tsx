'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Link01,
  Image01,
} from '@untitledui/icons';
import { api } from '@/lib/api';

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  minHeight?: string;
}

function createFigureHtml(src: string, alt: string): string {
  const cleanAlt = alt || '';
  const displayAlt = cleanAlt || 'Tambahkan alt text gambar...';
  return (
    `<figure class="editor-figure group relative my-4 rounded-xl border border-transparent hover:border-[#465984]/30 p-2 text-center transition-all" data-src="${src}" data-alt="${cleanAlt}">` +
      `<div contenteditable="false" class="editor-figure-actions absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition z-10 select-none">` +
        `<button type="button" data-action="edit-alt" class="px-2 py-1 rounded bg-[#181d27]/85 hover:bg-[#181d27] text-white text-[11px] font-semibold backdrop-blur-xs cursor-pointer shadow-xs transition" title="Ubah Alt Text">Alt Text</button>` +
        `<button type="button" data-action="delete-figure" class="px-2 py-1 rounded bg-red-600/85 hover:bg-red-700 text-white text-[11px] font-semibold backdrop-blur-xs cursor-pointer shadow-xs transition" title="Hapus Gambar dari Artikel">Hapus</button>` +
      `</div>` +
      `<img src="${src}" alt="${cleanAlt}" class="rounded-lg max-w-full mx-auto" />` +
      `<figcaption contenteditable="true" class="editor-figcaption text-xs text-[#535862] mt-1.5 font-medium italic text-center cursor-text hover:text-[#181d27] transition-colors" title="Klik untuk edit Alt Text">${displayAlt}</figcaption>` +
    `</figure>`
  );
}

// Convert Markdown to visual HTML for contentEditable
function markdownToHtml(markdown: string): string {
  if (!markdown) return '<p><br></p>';

  const lines = markdown.split('\n');
  const htmlParts: string[] = [];
  let inUl = false;
  let inOl = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inUl) {
          if (inOl) { htmlParts.push('</ol>'); inOl = false; }
          htmlParts.push('<ul>');
          inUl = true;
        }
        htmlParts.push(`<li>${formatInline(trimmed.substring(2))}</li>`);
        continue;
      } else if (inUl) {
        htmlParts.push('</ul>');
        inUl = false;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        if (!inOl) {
          if (inUl) { htmlParts.push('</ul>'); inUl = false; }
          htmlParts.push('<ol>');
          inOl = true;
        }
        const text = trimmed.replace(/^\d+\.\s/, '');
        htmlParts.push(`<li>${formatInline(text)}</li>`);
        continue;
      } else if (inOl) {
        htmlParts.push('</ol>');
        inOl = false;
      }

      if (!trimmed) {
        continue;
      }

      if (line.startsWith('![')) {
        const match = line.match(/^!\[(.*?)\]\((.*?)\)/);
        if (match) {
          const alt = match[1] || '';
          const src = match[2] || '';
          htmlParts.push(createFigureHtml(src, alt));
          continue;
        }
      }

      if (line.startsWith('### ')) {
        htmlParts.push(`<h3>${formatInline(line.substring(4))}</h3>`);
      } else if (line.startsWith('## ')) {
        htmlParts.push(`<h2>${formatInline(line.substring(3))}</h2>`);
      } else if (line.startsWith('# ')) {
        htmlParts.push(`<h1>${formatInline(line.substring(2))}</h1>`);
      } else if (line.startsWith('> ')) {
        htmlParts.push(`<blockquote>${formatInline(line.substring(2))}</blockquote>`);
      } else {
        htmlParts.push(`<p>${formatInline(line)}</p>`);
      }
    }

    if (inUl) htmlParts.push('</ul>');
    if (inOl) htmlParts.push('</ol>');

    return htmlParts.join('') || '<p><br></p>';
  }

  function formatInline(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
        return createFigureHtml(src, alt);
      });
  }

// Convert visual HTML from contentEditable back to clean Markdown
function htmlToMarkdown(element: HTMLElement): string {
  const parts: string[] = [];

  element.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) parts.push(text);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    const inlineContent = (target: HTMLElement): string => {
      let res = '';
      target.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          res += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const cEl = child as HTMLElement;
          if (cEl.classList.contains('editor-figure-actions') || cEl.getAttribute('data-action')) {
            return;
          }
          const cTag = cEl.tagName.toLowerCase();
          if (cTag === 'strong' || cTag === 'b') {
            res += `**${inlineContent(cEl)}**`;
          } else if (cTag === 'em' || cTag === 'i') {
            res += `*${inlineContent(cEl)}*`;
          } else if (cTag === 'u') {
            res += `<u>${inlineContent(cEl)}</u>`;
          } else if (cTag === 'del' || cTag === 's' || cTag === 'strike') {
            res += `~~${inlineContent(cEl)}~~`;
          } else if (cTag === 'a') {
            const href = cEl.getAttribute('href') || '#';
            res += `[${inlineContent(cEl)}](${href})`;
          } else if (cTag === 'figure' || cEl.classList.contains('editor-figure')) {
            const img = cEl.querySelector('img');
            const figcaption = cEl.querySelector('figcaption');
            if (img) {
              const src = img.getAttribute('src') || cEl.getAttribute('data-src') || '';
              let alt = cEl.getAttribute('data-alt') || figcaption?.textContent?.trim() || img.getAttribute('alt') || '';
              if (alt === 'Tambahkan alt text gambar...') alt = '';
              if (src) res += `\n\n![${alt}](${src})\n\n`;
            }
          } else if (cTag === 'img') {
            const src = cEl.getAttribute('src') || '';
            const alt = cEl.getAttribute('alt') || '';
            if (src) res += `\n\n![${alt}](${src})\n\n`;
          } else if (cTag === 'br') {
            res += '\n';
          } else {
            res += inlineContent(cEl);
          }
        }
      });
      return res;
    };

    if (tag === 'figure' || el.classList.contains('editor-figure')) {
      const img = el.querySelector('img');
      const figcaption = el.querySelector('figcaption');
      if (img) {
        const src = img.getAttribute('src') || el.getAttribute('data-src') || '';
        let alt = el.getAttribute('data-alt') || figcaption?.textContent?.trim() || img.getAttribute('alt') || '';
        if (alt === 'Tambahkan alt text gambar...') alt = '';
        if (src) parts.push(`![${alt}](${src})`);
        return;
      }
    } else if (tag === 'img') {
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      if (src) parts.push(`![${alt}](${src})`);
      return;
    } else if (tag === 'h1') {
      parts.push(`# ${inlineContent(el)}`);
    } else if (tag === 'h2') {
      parts.push(`## ${inlineContent(el)}`);
    } else if (tag === 'h3') {
      parts.push(`### ${inlineContent(el)}`);
    } else if (tag === 'blockquote') {
      parts.push(`> ${inlineContent(el)}`);
    } else if (tag === 'ul') {
      el.querySelectorAll('li').forEach((li) => {
        parts.push(`- ${inlineContent(li)}`);
      });
    } else if (tag === 'ol') {
      el.querySelectorAll('li').forEach((li, idx) => {
        parts.push(`${idx + 1}. ${inlineContent(li)}`);
      });
    } else if (tag === 'p' || tag === 'div') {
      const text = inlineContent(el).trim();
      if (text) parts.push(text);
    }
  });

  return parts.join('\n\n');
}

export function RichTextEditor({
  value,
  onChange,
  minHeight = '380px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    p: true,
    h1: false,
    h2: false,
    h3: false,
    blockquote: false,
  });

  // Initialize editor HTML from markdown value
  useEffect(() => {
    if (!editorRef.current) return;
    const currentMd = htmlToMarkdown(editorRef.current);
    if (currentMd.trim() !== value.trim()) {
      editorRef.current.innerHTML = markdownToHtml(value);
    }
  }, [value]);

  const updateFormatState = useCallback(() => {
    if (typeof window === 'undefined' || !document.queryCommandState) return;
    try {
      const blockVal = (document.queryCommandValue('formatBlock') || '').toLowerCase();
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        p: blockVal === 'p' || blockVal === 'div' || !['h1', 'h2', 'h3', 'blockquote'].includes(blockVal),
        h1: blockVal === 'h1',
        h2: blockVal === 'h2',
        h3: blockVal === 'h3',
        blockquote: blockVal === 'blockquote',
      });
    } catch {
      // fallback
    }
  }, []);

  const handleInput = () => {
    if (!editorRef.current) return;
    const md = htmlToMarkdown(editorRef.current);
    onChange(md);
    updateFormatState();
  };

  const exec = (command: string, arg: string | undefined = undefined) => {
    if (typeof window === 'undefined') return;
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const setHeading = (level: 1 | 2 | 3) => {
    const current = document.queryCommandValue('formatBlock');
    const tag = `h${level}`;
    if (current.toLowerCase() === tag) {
      exec('formatBlock', '<p>');
    } else {
      exec('formatBlock', `<${tag}>`);
    }
  };

  const setBlockquote = () => {
    const current = document.queryCommandValue('formatBlock');
    if (current.toLowerCase() === 'blockquote') {
      exec('formatBlock', '<p>');
    } else {
      exec('formatBlock', '<blockquote>');
    }
  };

  const setLink = () => {
    const url = window.prompt('Masukkan URL Tautan:');
    if (url) {
      exec('createLink', url);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleEditorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const defaultAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
    const userAlt = window.prompt('Masukkan Alt Text Gambar (SEO Image Alt Tag):', defaultAlt);
    if (userAlt === null) {
      if (e.target) e.target.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      const cleanAlt = userAlt.trim() || defaultAlt;
      const targetSlug = file.name.replace(/\.[^/.]+$/, '');
      const media = await api.uploadMedia(file, cleanAlt, true, targetSlug);

      const figureHtml = createFigureHtml(media.url, cleanAlt) + '<p><br></p>';

      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, figureHtml);
        handleInput();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah gambar';
      alert(msg);
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 1. Delete Figure Action
    const deleteBtn = target.closest('[data-action="delete-figure"]');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const figure = deleteBtn.closest('.editor-figure');
      if (figure && window.confirm('Hapus gambar ini dari artikel?')) {
        figure.remove();
        handleInput();
      }
      return;
    }

    // 2. Edit Alt Text Action
    const editAltBtn = target.closest('[data-action="edit-alt"]');
    const isImg = target.tagName.toLowerCase() === 'img';
    if (editAltBtn || isImg) {
      e.preventDefault();
      e.stopPropagation();
      const figure = (editAltBtn || target).closest('.editor-figure') as HTMLElement | null;
      if (!figure) return;
      const img = figure.querySelector('img');
      const figcaption = figure.querySelector('figcaption');
      const currentAlt =
        figure.getAttribute('data-alt') ||
        figcaption?.textContent?.trim() ||
        img?.getAttribute('alt') ||
        '';
      const cleanCurrent = currentAlt === 'Tambahkan alt text gambar...' ? '' : currentAlt;
      const newAlt = window.prompt('Ubah Alt Text Gambar (SEO Image Alt Tag):', cleanCurrent);
      if (newAlt !== null) {
        const cleanAlt = newAlt.trim();
        if (img) img.setAttribute('alt', cleanAlt);
        if (figcaption) {
          figcaption.textContent = cleanAlt || 'Tambahkan alt text gambar...';
        }
        figure.setAttribute('data-alt', cleanAlt);
        handleInput();
      }
      return;
    }
  };

  return (
    <div className="w-full border border-[#d5d7da] rounded-xl bg-white shadow-xs focus-within:border-[#465984] focus-within:ring-1 focus-within:ring-[#465984] transition-all relative">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        onChange={handleEditorImageUpload}
        className="hidden"
      />

      {/* Sticky Visual Toolbar - stays pinned under the page header when scrolling */}
      <div className="sticky top-[53px] lg:top-16 z-30 flex flex-wrap items-center gap-1 p-2 bg-white/95 backdrop-blur-md rounded-t-xl border-b border-[#eaecf0] text-sm text-[#334155] select-none shadow-xs">
        {/* Headings & Paragraph Selector */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => exec('formatBlock', '<p>')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
              activeFormats.p ? 'bg-[#e2e8f0] text-[#0f172a] shadow-xs' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Paragraf / Teks Normal (P)"
          >
            P
          </button>
          <button
            type="button"
            onClick={() => setHeading(1)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              activeFormats.h1 ? 'bg-[#e2e8f0] text-[#0f172a]' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Heading 1 (~32px Bold)"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => setHeading(2)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              activeFormats.h2 ? 'bg-[#e2e8f0] text-[#0f172a]' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Heading 2 (~24px Bold)"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => setHeading(3)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              activeFormats.h3 ? 'bg-[#e2e8f0] text-[#0f172a]' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Heading 3 (~18px Bold)"
          >
            H3
          </button>
        </div>

        <div className="h-5 w-px bg-[#cbd5e1] mx-1" />

        {/* Text Formats */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => exec('bold')}
            className={`size-7 rounded font-bold transition flex items-center justify-center ${
              activeFormats.bold ? 'bg-[#e2e8f0] text-[#0f172a]' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Tebal (Bold)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            className={`size-7 rounded italic transition flex items-center justify-center ${
              activeFormats.italic ? 'bg-[#e2e8f0] text-[#0f172a]' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Miring (Italic)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => exec('underline')}
            className={`size-7 rounded underline transition flex items-center justify-center ${
              activeFormats.underline ? 'bg-[#e2e8f0] text-[#0f172a]' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Garis Bawah (Underline)"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => exec('strikeThrough')}
            className={`size-7 rounded line-through transition flex items-center justify-center ${
              activeFormats.strike ? 'bg-[#e2e8f0] text-[#0f172a]' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Coret (Strikethrough)"
          >
            S
          </button>
        </div>

        <div className="h-5 w-px bg-[#cbd5e1] mx-1" />

        {/* Lists */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            className="px-2 py-1 rounded text-xs font-medium hover:bg-[#e2e8f0]/60 text-[#475569] transition flex items-center gap-1"
            title="Daftar Poin (Bullet List)"
          >
            <span>•</span>
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            className="px-2 py-1 rounded text-xs font-medium hover:bg-[#e2e8f0]/60 text-[#475569] transition flex items-center gap-1"
            title="Daftar Nomor (Ordered List)"
          >
            <span>1.</span>
            <span>List</span>
          </button>
        </div>

        <div className="h-5 w-px bg-[#cbd5e1] mx-1" />

        {/* Blockquote */}
        <button
            type="button"
            onClick={setBlockquote}
            className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
              activeFormats.blockquote ? 'bg-[#e2e8f0] text-[#0f172a] shadow-xs' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Kutipan (Blockquote)"
        >
          <span>&ldquo;</span>
          <span>Quote</span>
        </button>

        <div className="h-5 w-px bg-[#cbd5e1] mx-1" />

        {/* Alignments */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => exec('justifyLeft')}
            className="size-7 rounded hover:bg-[#e2e8f0]/60 text-[#475569] transition flex items-center justify-center"
            title="Rata Kiri"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => exec('justifyCenter')}
            className="size-7 rounded hover:bg-[#e2e8f0]/60 text-[#475569] transition flex items-center justify-center"
            title="Rata Tengah"
          >
            ↔
          </button>
          <button
            type="button"
            onClick={() => exec('justifyRight')}
            className="size-7 rounded hover:bg-[#e2e8f0]/60 text-[#475569] transition flex items-center justify-center"
            title="Rata Kanan"
          >
            →
          </button>
        </div>

        <div className="h-5 w-px bg-[#cbd5e1] mx-1" />

        {/* Media & Links */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={setLink}
            className="px-2 py-1 rounded text-xs font-medium hover:bg-[#e2e8f0]/60 text-[#475569] transition flex items-center gap-1"
            title="Sisipkan Tautan (Link)"
          >
            <Link01 className="size-3.5" />
            <span>Link</span>
          </button>
          <button
            type="button"
            onClick={addImage}
            disabled={uploadingImage}
            className="px-2 py-1 rounded text-xs font-medium hover:bg-[#e2e8f0]/60 text-[#475569] transition flex items-center gap-1 disabled:opacity-50"
            title="Sisipkan Gambar (dengan Alt Text)"
          >
            <Image01 className="size-3.5" />
            <span>{uploadingImage ? 'Mengunggah...' : 'Image'}</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onClick={handleEditorClick}
        onKeyUp={updateFormatState}
        onMouseUp={updateFormatState}
        style={{ minHeight }}
        className="w-full p-5 focus:outline-none text-[#1e293b] leading-relaxed overflow-y-auto cursor-text [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-[#1e293b] [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#1e293b] [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#1e293b] [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:text-base [&_p]:text-[#334155] [&_p]:leading-relaxed [&_p]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#94a3b8] [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-[#475569] [&_blockquote]:my-3 [&_blockquote]:bg-[#f8fafc] [&_blockquote]:rounded-r-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_a]:text-[#465984] [&_a]:underline [&_figure]:my-4 [&_figure]:text-center [&_figure_img]:rounded-xl [&_figure_img]:max-w-full [&_figure_img]:mx-auto [&_figure_figcaption]:text-xs [&_figure_figcaption]:text-[#535862] [&_figure_figcaption]:mt-1.5 [&_figure_figcaption]:font-medium [&_figure_figcaption]:italic"
      />

      {/* Footer Status Bar */}
      <div className="px-4 py-2 bg-[#f8fafc] border-t border-[#eaecf0] rounded-b-xl flex items-center justify-between text-xs text-[#717680]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#465984]">WYSIWYG Visual Canvas</span>
          <span>•</span>
          <span>Alt Text Gambar langsung terlihat & dapat diedit di bawah gambar</span>
        </div>
        <div className="text-[11px] text-[#94a3b8]">
          Tersimpan otomatis ke database sebagai Markdown &amp; HTML terstruktur
        </div>
      </div>
    </div>
  );
}
