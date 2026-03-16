import { useState, useEffect, useCallback } from 'react';
import { Tag } from '@/components/home/SortableTag';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { PREMIUM_STORAGE_KEY } from '@/lib/constants/premium-tags';

export function usePremiumTagManager() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedTag, setSelectedTag] = useState('recommend');
    const [showTagManager, setShowTagManager] = useState(false);
    const [newTagInput, setNewTagInput] = useState('');
    const [justAddedTag, setJustAddedTag] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch tags: 优先从 localStorage 恢复，否则使用默认标签
    useEffect(() => {
        const saved = localStorage.getItem(PREMIUM_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setTags(parsed);
                    setLoading(false);
                    return;
                }
            } catch { /* 解析失败则使用默认 */ }
        }

        // 默认标签：value 为关键词，用于搜索；空值表示浏览所有源的最新内容
        const defaultTags: Tag[] = [
            { id: 'recommend', label: '今日推荐', value: '' },
            { id: 'guochan',   label: '国产',     value: '国产' },
            { id: 'riben',     label: '日本',     value: '日本' },
            { id: 'oumei',     label: '欧美',     value: '欧美' },
            { id: 'hanguo',    label: '韩国',     value: '韩国' },
            { id: 'dongman',   label: '动漫',     value: '动漫' },
            { id: 'zhubo',     label: '主播',     value: '主播' },
            { id: 'zipai',     label: '自拍',     value: '自拍' },
            { id: 'yuanchuang', label: '原创',    value: '原创' },
        ];
        setTags(defaultTags);
        setLoading(false);
    }, []);

    // Save tags to local storage whenever they change
    useEffect(() => {
        if (tags.length > 0 && !loading) {
            localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(tags));
        }
    }, [tags, loading]);

    const handleAddTag = () => {
        if (!newTagInput.trim()) return;
        const newTag: Tag = {
            id: `custom_${Date.now()}`,
            label: newTagInput.trim(),
            value: newTagInput.trim(),
        };
        const newTags = [...tags, newTag];
        setTags(newTags);
        localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(newTags));
        setNewTagInput('');
        setJustAddedTag(true);
    };

    const handleDeleteTag = (tagId: string) => {
        // Instead of deleting, we could hide it, but for now let's just remove it from the list
        // It will reappear if local storage is cleared or if we implement a "hidden tags" feature
        // For now, simple removal from current view
        const newTags = tags.filter((t) => t.id !== tagId);
        setTags(newTags);

        if (selectedTag === tagId) {
            setSelectedTag(newTags[0]?.id || '');
        }
    };

    const handleRestoreDefaults = () => {
        localStorage.removeItem(PREMIUM_STORAGE_KEY);
        const defaultTags: Tag[] = [
            { id: 'recommend', label: '今日推荐', value: '' },
            { id: 'guochan',   label: '国产',     value: '国产' },
            { id: 'riben',     label: '日本',     value: '日本' },
            { id: 'oumei',     label: '欧美',     value: '欧美' },
            { id: 'hanguo',    label: '韩国',     value: '韩国' },
            { id: 'dongman',   label: '动漫',     value: '动漫' },
            { id: 'zhubo',     label: '主播',     value: '主播' },
            { id: 'zipai',     label: '自拍',     value: '自拍' },
            { id: 'yuanchuang', label: '原创',    value: '原创' },
        ];
        setTags(defaultTags);
        setSelectedTag('recommend');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setTags((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return {
        tags,
        selectedTag,
        newTagInput,
        showTagManager,
        justAddedTag,
        loading,
        setSelectedTag,
        setNewTagInput,
        setShowTagManager,
        setJustAddedTag,
        handleAddTag,
        handleDeleteTag,
        handleRestoreDefaults,
        handleDragEnd,
    };
}
