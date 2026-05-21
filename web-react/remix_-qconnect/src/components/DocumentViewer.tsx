import React, { useEffect, useRef } from 'react';
import { X, Download, Printer, Share2, ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';

interface DocumentViewerProps {
  title: string;
  content?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  watermarkText?: string;
  type?: 'pdf' | 'word' | 'excel' | 'text' | 'markdown';
}

export function DocumentViewer({ 
  title, 
  content, 
  isOpen, 
  onClose, 
  watermarkText = 'CONFIDENTIAL - DO NOT DISTRIBUTE',
  type = 'text'
}: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="uppercase">{type} Document</span>
                <span>•</span>
                <span className="text-destructive font-medium">受控文件 (Controlled Document)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
              <Printer className="h-4 w-4" /> 打印
            </Button>
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
              <Download className="h-4 w-4" /> 下载
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content Area with Watermark */}
        <div 
          ref={containerRef}
          className="relative flex-1 overflow-auto bg-muted/10 p-8 sm:p-12"
        >
          {/* Watermark Overlay */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden flex flex-wrap items-center justify-center gap-12 opacity-[0.03] dark:opacity-[0.05] z-50 select-none" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i} 
                className="text-4xl font-bold whitespace-nowrap -rotate-45 text-foreground"
              >
                {watermarkText}
              </div>
            ))}
          </div>

          {/* Document Paper */}
          <div className="relative z-10 max-w-3xl mx-auto bg-background shadow-md border border-border/50 rounded-sm min-h-full p-10 sm:p-16">
            {content ? (
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                {content}
              </div>
            ) : (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-center mb-12">{title}</h1>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
                <div className="h-8"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8"></div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="h-32 bg-muted rounded"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
                <div className="h-8"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
