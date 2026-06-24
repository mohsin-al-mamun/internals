'use client';

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';
import javascript from 'highlight.js/lib/languages/javascript';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('sql', sql);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('plaintext', plaintext);

interface Props {
  html: string;
  className?: string;
}

export default function ContentBody({ html, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.querySelectorAll<HTMLElement>('pre.codeblock').forEach(block => {
      if (block.dataset.highlighted) return;
      block.dataset.highlighted = 'yes';
      const result = hljs.highlightAuto(block.textContent ?? '', ['sql', 'javascript', 'yaml', 'bash']);
      block.innerHTML = result.value;
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
