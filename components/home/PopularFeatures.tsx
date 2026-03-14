/**
 * PopularFeatures - Main component for popular movies section
 * Displays Douban movie recommendations with tag filtering and infinite scroll.
 * Default tab is "热门" (trending).
 * Clicking a movie navigates directly to the player page for instant playback.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { TagManager } from './TagManager';
import { MovieGrid } from './MovieGrid';
import { useTagManager } from './hooks/useTagManager';
import { usePopularMovies } from './hooks/usePopularMovies';
import { HeroSlideshow } from './TmdbSlideshow';
import { useUserStore } from '@/lib/store/user-store';
import { VipPrompt } from '@/components/premium/VipPrompt';
import { AuthModal } from '@/components/auth/AuthModal';

interface PopularFeaturesProps {
  onSearch?: (query: string) => void;
}

export function PopularFeatures({ onSearch }: PopularFeaturesProps) {
  const router = useRouter();
  const { user } = useUserStore();
  const [showVipPrompt, setShowVipPrompt] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // 点击午夜版 Tab
  const handleMidnightClick = () => {
    if (user?.isVip) {
      router.push('/premium');
    } else {
      setShowVipPrompt(true);
    }
  };
  const {
    tags,
    selectedTag,
    contentType,
    newTagInput,
    showTagManager,
    justAddedTag,
    setContentType,
    setSelectedTag,
    setNewTagInput,
    setShowTagManager,
    setJustAddedTag,
    handleAddTag,
    handleDeleteTag,
    handleRestoreDefaults,
    handleDragEnd,
    isLoadingTags,
  } = useTagManager();

  const {
    movies,
    loading,
    hasMore,
    prefetchRef,
    loadMoreRef,
  } = usePopularMovies(selectedTag, tags, contentType);

  const handleMovieClick = (movie: any) => {
    // 直达播放：导航到播放页，自动搜索最佳源并播放
    const params = new URLSearchParams();
    params.set('title', movie.title);
    params.set('type', contentType); // 'movie' | 'tv' — 用于消歧义
    router.push(`/player?${params.toString()}`);
  };

  const handleTagSelect = (tagId: string) => {
    if (tagId === 'custom_高级' || tags.find(t => t.id === tagId)?.label === '高级') {
      window.location.href = '/premium';
      return;
    }
    setSelectedTag(tagId);
  };

  return (
    <div className="animate-fade-in">
      {/* 🏆 Hero 排行榜幻灯片 — 基于 RankingCarousel 布局 + TMDB Backdrop */}
      <HeroSlideshow contentType={contentType} onSearch={onSearch} />

      {/* Content Type Toggle (Capsule Liquid Glass - Fixed & Centered) */}
      <div className="mb-4 flex justify-center">
        <div className="content-type-toggle relative w-[28rem] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full grid grid-cols-3 backdrop-blur-2xl shadow-lg ring-1 ring-white/10 overflow-hidden">
          {/* Sliding Indicator - 三等分定位 */}
          <div
            className="absolute rounded-full transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) pointer-events-none"
            style={{
              top: '4px',
              bottom: '4px',
              width: 'calc(33.333% - 4px)',
              left: contentType === 'movie' ? '4px' : 'calc(33.333%)',
              background: 'var(--accent-color)',
              boxShadow: '0 0 15px rgba(0,122,255,0.4)',
            }}
          />

          <button
            onClick={() => setContentType('movie')}
            className={`relative z-10 py-2.5 text-sm font-bold transition-colors duration-300 cursor-pointer flex justify-center items-center ${contentType === 'movie' ? 'text-white' : 'text-[var(--text-color-secondary)] hover:text-[var(--text-color)]'
              }`}
          >
            电影
          </button>
          <button
            onClick={() => setContentType('tv')}
            className={`relative z-10 py-2.5 text-sm font-bold transition-colors duration-300 cursor-pointer flex justify-center items-center ${contentType === 'tv' ? 'text-white' : 'text-[var(--text-color-secondary)] hover:text-[var(--text-color)]'
              }`}
          >
            电视剧
          </button>
          <button
            onClick={handleMidnightClick}
            className="relative z-10 py-2.5 text-sm font-bold transition-colors duration-300 cursor-pointer flex justify-center items-center text-[var(--text-color-secondary)] hover:text-[var(--text-color)]"
          >
            午夜版
          </button>
        </div>
      </div>

      {/* VIP 开通引导弹窗 */}
      {showVipPrompt && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* 遮罩 */}
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setShowVipPrompt(false)}
          />
          {/* 弹窗内容 */}
          <div className="relative z-10 w-[90vw] max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <VipPrompt
              asModal
              onClose={() => setShowVipPrompt(false)}
              onOpenLogin={() => {
                setShowVipPrompt(false);
                setShowLogin(true);
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* 登录弹窗 */}
      {showLogin && (
        <AuthModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      )}

      <TagManager
        tags={tags}
        selectedTag={selectedTag}
        showTagManager={showTagManager}
        newTagInput={newTagInput}
        justAddedTag={justAddedTag}
        onTagSelect={handleTagSelect}
        onTagDelete={handleDeleteTag}
        onToggleManager={() => setShowTagManager(!showTagManager)}
        onRestoreDefaults={handleRestoreDefaults}
        onNewTagInputChange={setNewTagInput}
        onAddTag={handleAddTag}
        onDragEnd={handleDragEnd}
        onJustAddedTagHandled={() => setJustAddedTag(false)}
        isLoadingTags={isLoadingTags}
      />

      <MovieGrid
        movies={movies}
        loading={loading}
        hasMore={hasMore}
        onMovieClick={handleMovieClick}
        prefetchRef={prefetchRef}
        loadMoreRef={loadMoreRef}
      />
    </div>
  );
}
