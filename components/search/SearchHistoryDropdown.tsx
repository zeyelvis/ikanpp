'use client';

import { useEffect, useRef } from 'react';
import { Icons } from '@/components/ui/Icon';
import type { SearchHistoryItem } from '@/lib/store/search-history-store';
import { SearchHistoryEmptyState } from './SearchHistoryEmptyState';
import { SearchHistoryHeader } from './SearchHistoryHeader';
import { SearchHistoryListItem } from './SearchHistoryListItem';
import { useTrendingStore } from '@/lib/store/trending-store';

interface SearchHistoryDropdownProps {
  isOpen: boolean;
  searchHistory: SearchHistoryItem[];
  highlightedIndex: number;
  triggerRef: React.RefObject<HTMLInputElement | null>;
  onSelectItem: (query: string) => void;
  onRemoveItem: (query: string) => void;
  onClearAll: () => void;
}

export function SearchHistoryDropdown({
  isOpen,
  searchHistory,
  highlightedIndex,
  triggerRef,
  onSelectItem,
  onRemoveItem,
  onClearAll,
}: SearchHistoryDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const trendingKeywords = useTrendingStore(s => s.getKeywords)(10);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex === -1 || !dropdownRef.current) return;

    const highlightedElement = dropdownRef.current.querySelector(
      `[data-index="${highlightedIndex}"]`
    );

    if (highlightedElement) {
      highlightedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [highlightedIndex]);

  // 无历史且无热搜时不显示
  if (!isOpen || (searchHistory.length === 0 && trendingKeywords.length === 0)) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="search-history-dropdown absolute top-full left-0 right-0 mt-2 z-[9999]"
      role="listbox"
      aria-label="搜索历史"
      onMouseDown={(e) => {
        // Prevent blur when clicking inside dropdown
        e.preventDefault();
      }}
    >
      {/* 搜索历史 */}
      {searchHistory.length > 0 && (
        <>
          <SearchHistoryHeader onClearAll={onClearAll} />
          <div className="search-history-divider" />
          <div className="search-history-list">
            {searchHistory.map((item, index) => (
              <SearchHistoryListItem
                key={`${item.query}-${item.timestamp}`}
                item={item}
                index={index}
                isHighlighted={index === highlightedIndex}
                onSelectItem={onSelectItem}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
        </>
      )}

      {/* 🔥 热搜关键词 */}
      {trendingKeywords.length > 0 && (
        <>
          {searchHistory.length > 0 && <div className="search-history-divider" />}
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">🔥</span>
              <span className="text-[10px] font-semibold tracking-wider"
                    style={{ color: 'var(--text-color-secondary)', opacity: 0.5 }}>
                大家在搜
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingKeywords.map((kw, i) => (
                <button
                  key={`${kw.title}-${i}`}
                  onClick={() => onSelectItem(kw.title)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all hover:scale-105 cursor-pointer"
                  style={{
                    color: 'var(--text-color)',
                    background: 'var(--glass-bg, rgba(255,255,255,0.06))',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                  }}
                >
                  {kw.title}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
