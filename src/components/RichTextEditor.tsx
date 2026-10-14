'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Link01,
  Image01,
} from '@untitledui/icons';

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  minHeight?: string;
}

// Convert Markdown to visual HTML for contentEditable
function markdownToHtml(md: string): string {
  if (!md) return '<p><br></p>';

  // Clean empty lines
  const lines = md.split('\n');
  const htmlParts: string[] = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (inOl) {
        htmlParts.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        htmlParts.push('<ul>');
        inUl = true;
      }
      const itemText = formatInline(line.substring(2));
      htmlParts.push(`<li>${itemText}</li>`);
      continue;
    } else if (/^\d+\.\s+/.test(line)) {
      if (inUl) {
        htmlParts.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        htmlParts.push('<ol>');
        inOl = true;
      }
      const itemText = formatInline(line.replace(/^\d+\.\s+/, ''));
      htmlParts.push(`<li>${itemText}</li>`);
      continue;
    } else {
      if (inUl) {
        htmlParts.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        htmlParts.push('</ol>');
        inOl = false;
      }
    }

    if (!line) {
      continue;
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
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');
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
          } else if (cTag === 'img') {
            const src = cEl.getAttribute('src') || '';
            const alt = cEl.getAttribute('alt') || '';
            res += `![${alt}](${src})`;
          } else if (cTag === 'br') {
            res += '\n';
          } else {
            res += inlineContent(cEl);
          }
        }
      });
      return res;
    };

    if (tag === 'h1') {
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
      let idx = 1;
      el.querySelectorAll('li').forEach((li) => {
        parts.push(`${idx++}. ${inlineContent(li)}`);
      });
    } else if (tag === 'p' || tag === 'div') {
      const text = inlineContent(el).trim();
      if (text) parts.push(text);
    } else {
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
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        h1: document.queryCommandValue('formatBlock') === 'h1',
        h2: document.queryCommandValue('formatBlock') === 'h2',
        h3: document.queryCommandValue('formatBlock') === 'h3',
        blockquote: document.queryCommandValue('formatBlock') === 'blockquote',
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

  const addImage = () => {
    const url = window.prompt('Masukkan URL Gambar:');
    if (url) {
      exec('insertImage', url);
    }
  };

  return (
    <div className="w-full border border-[#d5d7da] rounded-xl bg-white overflow-hidden shadow-xs focus-within:border-[#465984] focus-within:ring-1 focus-within:ring-[#465984] transition-all">
      {/* Visual Toolbar (Sesuai Referensi Gambar 2) */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#f8fafc] border-b border-[#eaecf0] text-sm text-[#334155] select-none">
        {/* Headings */}
        <div className="flex items-center gap-0.5">
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
            className={`size-7 rounded italic font-serif transition flex items-center justify-center ${
              activeFormats.italic ? 'bg-[#e2e8f0] text-[#0f172a]' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Miring (Italic)"
          >
            /
          </button>
          <button
            type="button"
            onClick={() => exec('underline')}
            className={`size-7 rounded underline font-medium transition flex items-center justify-center ${
              activeFormats.underline ? 'bg-[#e2e8f0] text-[#0f172a]' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Garis Bawah (Underline)"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => exec('strikeThrough')}
            className={`size-7 rounded line-through font-medium transition flex items-center justify-center ${
              activeFormats.strike ? 'bg-[#e2e8f0] text-[#0f172a]' : 'hover:bg-[#e2e8f0]/60 text-[#475569]'
            }`}
            title="Coret (Strikethrough)"
          >
            S
          </button>
        </div>

        <div className="h-5 w-px bg-[#cbd5e1] mx-1" />

        {/* Lists */}
        <div className="flex items-center gap-1">
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
            className="px-2 py-1 rounded text-xs font-medium hover:bg-[#e2e8f0]/60 text-[#475569] transition flex items-center gap-1"
            title="Sisipkan Gambar"
          >
            <Image01 className="size-3.5" />
            <span>Image</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas (Sesuai Referensi Gambar 2) */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateFormatState}
        onMouseUp={updateFormatState}
        style={{ minHeight }}
        className="w-full p-5 focus:outline-none text-[#1e293b] leading-relaxed overflow-y-auto cursor-text [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-[#1e293b] [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#1e293b] [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#1e293b] [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:text-base [&_p]:text-[#334155] [&_p]:leading-relaxed [&_p]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#94a3b8] [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-[#475569] [&_blockquote]:my-3 [&_blockquote]:bg-[#f8fafc] [&_blockquote]:rounded-r-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_a]:text-[#465984] [&_a]:underline [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-3"
      />

      {/* Footer Status Bar */}
      <div className="px-4 py-2 bg-[#f8fafc] border-t border-[#eaecf0] flex items-center justify-between text-xs text-[#717680]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#465984]">WYSIWYG Visual Canvas</span>
          <span>•</span>
          <span>Tampilan akhir langsung tanpa karakter simbol markdown</span>
        </div>
        <div className="text-[11px] text-[#94a3b8]">
          Tersimpan otomatis ke database sebagai Markdown & HTML terstruktur
        </div>
      </div>
    </div>
  );
}
