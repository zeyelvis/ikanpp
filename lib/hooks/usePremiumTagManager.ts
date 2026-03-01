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

    // Fetch tags from API
    useEffect(() => {
        // 测试模式：跳过 API 获取，直接使用静态标签
        const staticTags: Tag[] = [
            { id: 'recommend', label: '今日推荐', value: '' },
            { id: 'wanghong', label: '网红主播', value: '' },
        ];
        setTags(staticTags);
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

    const handleRestoreDefaults = async () => {
        setLoading(true);
        localStorage.removeItem(PREMIUM_STORAGE_KEY);
        try {
            const response = await fetch('/api/premium/types');
            const data = await response.json();
            if (data.tags) {
                setTags(data.tags);
                setSelectedTag('recommend');
            }
        } catch (error) {
            console.error('Failed to restore tags:', error);
        } finally {
            setLoading(false);
        }
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
