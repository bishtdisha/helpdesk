'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

export interface MentionListProps {
  items: Array<{ id: string; name: string; email: string }>;
  command: (item: { id: string; name: string }) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command({ id: item.id, name: item.name });
      }
    };

    const upHandler = () => {
      setSelectedIndex(
        (selectedIndex + props.items.length - 1) % props.items.length
      );
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (props.items.length === 0) {
      return null;
    }

    return (
      <Card className="p-2 shadow-lg max-h-60 overflow-auto">
        {props.items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`flex items-center gap-2 w-full px-3 py-2 text-left rounded-md hover:bg-accent transition-colors ${
              index === selectedIndex ? 'bg-accent' : ''
            }`}
            onClick={() => selectItem(index)}
          >
            <Avatar className="h-6 w-6">
              <div className="bg-primary text-primary-foreground flex items-center justify-center h-full w-full text-xs font-medium">
                {item.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {item.email}
              </div>
            </div>
          </button>
        ))}
      </Card>
    );
  }
);

MentionList.displayName = 'MentionList';
