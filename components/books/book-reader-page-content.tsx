import { useMemo } from 'react';
import { Clipboard, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { ReaderTheme } from '@/constants/colors';

type BookReaderPageContentProps = {
  content: string;
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  theme: ReaderTheme;
  title: string | null;
  width: number;
  onSearchSelection: (value: string) => void;
};

type SelectionEvent = {
  type: 'copy' | 'search';
  selectedText: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildContentHtml(content: string) {
  const lines = content.split('\n');

  if (!lines.length) {
    return '<div class="reader-line">&nbsp;</div>';
  }

  return lines
    .map((line) => {
      const normalizedLine = line.trim();
      if (!normalizedLine) {
        return '<div class="reader-line reader-line-empty">&nbsp;</div>';
      }

      return `<div class="reader-line">${escapeHtml(normalizedLine)}</div>`;
    })
    .join('');
}

function buildReaderHtml({
  content,
  title,
  fontFamily,
  fontSize,
  lineHeight,
  theme,
}: {
  content: string;
  title: string | null;
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  theme: ReaderTheme;
}) {
  const titleHtml = title ? `<div class="chapter-title">${escapeHtml(title)}</div>` : '';
  const bodyHtml = buildContentHtml(content);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      :root {
        --bg: ${theme.backgroundColor};
        --text: ${theme.textColor};
        --border: ${theme.borderColor};
        --card: ${theme.cardColor};
        --accent: ${theme.primaryColor};
        --on-accent: ${theme.onPrimaryColor};
        --font-size: ${fontSize}px;
        --line-height: ${lineHeight}px;
        --font-family: ${fontFamily ?? 'serif'};
      }
      * {
        box-sizing: border-box;
        -webkit-touch-callout: none;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: var(--bg);
        color: var(--text);
        font-family: var(--font-family);
        font-size: var(--font-size);
        line-height: var(--line-height);
        overflow: hidden;
        user-select: text;
        -webkit-user-select: text;
      }
      body {
        padding: 0 0 8px 0;
      }
      #content {
        word-break: break-word;
      }
      .reader-line {
        margin: 0;
        white-space: pre-wrap;
      }
      .chapter-title {
        font-weight: 800;
        text-align: center;
        margin-bottom: 8px;
      }
      #selection-menu {
        position: fixed;
        display: none;
        z-index: 9999;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 8px;
        gap: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      }
      #selection-menu.visible {
        display: flex;
      }
      .menu-button {
        appearance: none;
        border: 1px solid var(--border);
        background: var(--card);
        color: var(--text);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 14px;
        font-weight: 700;
      }
      .menu-button:active {
        background: var(--accent);
        color: var(--on-accent);
      }
    </style>
  </head>
  <body>
    <div id="content">${titleHtml}${bodyHtml}</div>
    <div id="selection-menu" role="menu" aria-hidden="true">
      <button class="menu-button" data-action="copy" type="button">Копировать</button>
      <button class="menu-button" data-action="search" type="button">Поиск</button>
    </div>
    <script>
      (function () {
        const menu = document.getElementById('selection-menu');
        const buttons = Array.from(menu.querySelectorAll('[data-action]'));
        let selectedText = '';

        const postMessage = (payload) => {
          if (!window.ReactNativeWebView) {
            return;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        };

        const hideMenu = () => {
          menu.classList.remove('visible');
          menu.setAttribute('aria-hidden', 'true');
        };

        const showMenu = () => {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) {
            hideMenu();
            return;
          }

          const text = selection.toString().trim();
          if (!text) {
            hideMenu();
            return;
          }

          selectedText = text;
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          const menuWidth = 220;
          const menuHeight = 52;
          const left = Math.min(Math.max(rect.left + rect.width / 2 - menuWidth / 2, 12), window.innerWidth - menuWidth - 12);
          const preferredTop = rect.bottom + 12;
          const maxTop = window.innerHeight - menuHeight - 12;
          const top = Math.min(Math.max(preferredTop, 12), Math.max(maxTop, 12));

          menu.style.left = left + 'px';
          menu.style.top = top + 'px';
          menu.classList.add('visible');
          menu.setAttribute('aria-hidden', 'false');
        };

        document.addEventListener('selectionchange', () => {
          window.requestAnimationFrame(showMenu);
        });

        document.addEventListener('scroll', hideMenu, true);
        document.addEventListener('touchstart', (event) => {
          if (!menu.contains(event.target)) {
            hideMenu();
          }
        }, { passive: true });

        buttons.forEach((button) => {
          button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            if (!selectedText || !action) {
              return;
            }

            postMessage({ type: action, selectedText });
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
            }
            selectedText = '';
            hideMenu();
          });
        });
      })();
    </script>
  </body>
</html>`;
}

export function BookReaderPageContent({
  content,
  fontFamily,
  fontSize,
  lineHeight,
  theme,
  title,
  width,
  onSearchSelection,
}: BookReaderPageContentProps) {
  const html = useMemo(
    () =>
      buildReaderHtml({
        content,
        title,
        fontFamily,
        fontSize,
        lineHeight,
        theme,
      }),
    [content, fontFamily, fontSize, lineHeight, theme, title],
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    let payload: SelectionEvent | null = null;

    try {
      payload = JSON.parse(event.nativeEvent.data) as SelectionEvent;
    } catch {
      return;
    }

    const selectedText = payload.selectedText.trim();
    if (!selectedText) {
      return;
    }

    if (payload.type === 'copy') {
      Clipboard.setString(selectedText);
      return;
    }

    if (payload.type === 'search') {
      onSearchSelection(selectedText);
    }
  };

  return (
    <View style={[styles.page, { width }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        scrollEnabled={false}
        textZoom={100}
        bounces={false}
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, right: 0, bottom: 0, left: 0 }}
        showsVerticalScrollIndicator={false}
        style={[styles.webView, { backgroundColor: theme.backgroundColor }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingRight: 0,
    paddingTop: 12,
  },
  webView: {
    flex: 1,
  },
});
