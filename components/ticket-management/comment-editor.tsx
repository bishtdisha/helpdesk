'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Code,
  Lock,
  AtSign,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { MentionList, MentionListRef } from './mention-list';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { ReactRenderer } from '@tiptap/react';

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

interface CommentEditorProps {
  onSubmit: (content: string, isInternal: boolean) => Promise<void>;
  onCancel?: () => void;
  initialContent?: string;
  initialIsInternal?: boolean;
  placeholder?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  onFetchUsers?: (query: string) => Promise<Array<{ id: string; name: string; email: string }>>;
}

// Fetch users for mentions
async function fetchUsersForMention(query: string): Promise<Array<{ id: string; name: string; email: string }>> {
  try {
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Failed to fetch users for mention:', error);
    return [];
  }
}

export function CommentEditor({
  onSubmit,
  onCancel,
  initialContent = '',
  initialIsInternal = false,
  placeholder = 'Write a comment...',
  submitLabel = 'Post Comment',
  isSubmitting = false,
  onFetchUsers,
}: CommentEditorProps) {
  const [isInternal, setIsInternal] = useState(initialIsInternal);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false, // Disable default code block
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/10 text-primary px-1 rounded font-medium',
        },
        suggestion: {
          items: async ({ query }) => {
            const fetchFn = onFetchUsers || fetchUsersForMention;
            const users = await fetchFn(query);
            return users.slice(0, 5); // Limit to 5 suggestions
          },
          render: () => {
            let component: ReactRenderer<MentionListRef> | undefined;
            let popup: TippyInstance[] | undefined;

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },

              onUpdate(props) {
                component?.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              },

              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }

                return component?.ref?.onKeyDown(props) || false;
              },

              onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3 rounded-md border border-input bg-background',
      },
    },
  });

  const handleSubmit = async () => {
    if (!editor) return;

    const content = editor.getHTML();
    const textContent = editor.getText().trim();
    if (!textContent) return;

    await onSubmit(content, isInternal);
    editor.commands.clearContent();
    setIsInternal(false);
  };

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return null;
  }

  const isEmpty = editor.getText().trim().length === 0;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b pb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
            disabled={isSubmitting}
          >
            <Bold className="h-4 w-4" />
            <span className="sr-only">Bold</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
            disabled={isSubmitting}
          >
            <Italic className="h-4 w-4" />
            <span className="sr-only">Italic</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
            disabled={isSubmitting}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Bullet List</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
            disabled={isSubmitting}
          >
            <ListOrdered className="h-4 w-4" />
            <span className="sr-only">Numbered List</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={editor.isActive('link') ? 'bg-muted' : ''}
            disabled={isSubmitting}
          >
            <Link2 className="h-4 w-4" />
            <span className="sr-only">Link</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
            disabled={isSubmitting}
          >
            <Code className="h-4 w-4" />
            <span className="sr-only">Code Block</span>
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              editor.chain().focus().insertContent('@').run();
            }}
            disabled={isSubmitting}
            title="Mention user (@)"
          >
            <AtSign className="h-4 w-4" />
            <span className="sr-only">Mention User</span>
          </Button>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />

        {/* Footer */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="internal-note"
              checked={isInternal}
              onCheckedChange={setIsInternal}
              disabled={isSubmitting}
            />
            <Label
              htmlFor="internal-note"
              className="text-sm font-normal cursor-pointer flex items-center gap-1"
            >
              <Lock className="h-3.5 w-3.5" />
              Internal Note
            </Label>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isEmpty || isSubmitting}
            >
              {isSubmitting ? 'Posting...' : submitLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
