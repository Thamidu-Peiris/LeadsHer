import { useMemo } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useTheme } from '../../context/ThemeContext';

const SCRIPT = `${import.meta.env.BASE_URL}tinymce/tinymce.min.js`;

/**
 * Self-hosted TinyMCE (GPL) — free, no API key.
 */
export default function StoryRichTextEditor({ value, onChange, disabled }) {
  const { theme } = useTheme();

  const init = useMemo(
    () => ({
      license_key: 'gpl',
      height: 400,
      min_height: 280,
      menubar: false,
      branding: false,
      promotion: false,
      resize: 'vertical',
      max_height: 720,
      plugins: [
        'advlist',
        'autolink',
        'lists',
        'link',
        'charmap',
        'anchor',
        'searchreplace',
        'visualblocks',
        'code',
        'fullscreen',
        'insertdatetime',
        'wordcount',
      ],
      toolbar:
        'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link removeformat | code fullscreen',
      toolbar_mode: 'sliding',
      block_formats: 'Paragraph=p; Heading 2=h2; Heading 3=h3',
      skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
      content_css: theme === 'dark' ? 'dark' : 'default',
      content_style: `
        body {
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 16px;
          line-height: 1.65;
          padding: 12px 16px;
          max-width: 52rem;
          margin: 0 auto;
        }
        p { margin: 0.5em 0; }
      `,
      placeholder: 'Write your story…',
      statusbar: true,
      elementpath: false,
    }),
    [theme]
  );

  return (
    <div className="story-mce rounded-xl border border-outline-variant/20 overflow-hidden bg-white dark:bg-surface-container shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <Editor
        tinymceScriptSrc={SCRIPT}
        disabled={disabled}
        value={value}
        onEditorChange={(content) => onChange(content)}
        init={init}
      />
    </div>
  );
}
