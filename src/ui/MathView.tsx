import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathProps {
  math: string;
  block?: boolean;
  className?: string;
}

export function MathView({ math, block = false, className = '' }: MathProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: 'ignore',
      });
    } catch {
      return math;
    }
  }, [math, block]);

  return (
    <span
      className={`math-rendered ${block ? 'math-block' : 'math-inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
