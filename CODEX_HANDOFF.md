# Seminar Pointer — Codex 引き継ぎメモ

更新日: 2026-05-04  
状態: MVP 実装済み・ビルド通過・Electron 起動確認済み・GitHub 保存準備済み

---

## 次回ここから始める

1. Finder で `Seminar Pointer.app` をダブルクリックして起動確認
2. うまく開けない場合は `Seminar Pointer.command` をダブルクリック
3. 起動後、**⌘ + Shift + S** でオーバーレイ表示
4. ツールバーから四角・丸・線・矢印・テキスト・ここ見てを実操作テスト
5. Zoom で「画面共有（Desktop）」を選び、注釈が共有先に映るか確認

アプリ起動時は透明ウィンドウなので、起動しても何も表示されないのが正常です。  
操作開始は **⌘ + Shift + S** です。

---

## 起動方法

### Finder から

- 推奨: `Seminar Pointer.app` をダブルクリック
- 予備: `Seminar Pointer.command` をダブルクリック

### ターミナルから

```bash
cd "/Users/junkokonno/04_Seminar Pointer"
npm install
npm run dev
```

---

## 今回 Codex が直したこと

- `npm run build` 通過確認
- `npm run dev` で Electron 起動確認
- 複数ディスプレイ全体を覆うように Electron ウィンドウ範囲を改善
- 表示/非表示状態をメインプロセス側で一元管理
- 画面サイズ変更後も描画を再表示しやすく修正
- 空文字テキストスタンプを追加しないように修正
- 短すぎる線・矢印を残さないように修正
- テキスト描画の基準位置を `middle` に変更
- `useDrawing` に戻り値型を付け、`App.tsx` の型キャストを削除
- `npm start` を追加
- Finder 起動用 `Seminar Pointer.app` と `Seminar Pointer.command` を追加
- `.gitignore` を追加し、`node_modules` と `out` は GitHub に含めない方針にした

---

## まだ未テスト・要確認

| 機能 | 期待動作 | 確認方法 |
|------|----------|----------|
| Finder 起動 | `Seminar Pointer.app` で起動する | ダブルクリック後に ⌘+Shift+S |
| 表示切替 | ⌘+Shift+S で表示/非表示 | 2〜3回切り替える |
| 閉じるボタン | 閉じた後も次の ⌘+Shift+S で再表示 | 表示 → 閉じる → ⌘+Shift+S |
| 図形描画 | 四角・丸・線・矢印が描ける | ツール選択後ドラッグ |
| テキスト | ①②③や日本語が配置できる | テキストツールでクリック |
| ここ見て | クリック位置に波紋が出て消える | マーカーツールでクリック |
| 全消去 | 描画とマーカーが消える | ボタンまたは ⌘+Shift+C |
| クリックスルー | 非表示時に背後のアプリを操作できる | 非表示後にChrome等をクリック |
| Zoom共有 | 共有相手に注釈が見える | Desktop共有で確認 |
| フルスクリーン | Zoom/Meetの上に出る | フルスクリーン状態で確認 |

---

## macOS 権限メモ

初回起動やZoom共有時にうまく表示・共有されない場合は、以下を確認してください。

- システム設定 > プライバシーとセキュリティ > アクセシビリティ
- システム設定 > プライバシーとセキュリティ > 画面収録

`Electron`、`Terminal`、または起動に使ったアプリが許可対象として出る場合があります。

---

## ファイル構成

```text
src/main/main.ts                 Electron メインプロセス
src/preload/preload.ts           IPC ブリッジ
src/renderer/App.tsx             UI 状態管理
src/renderer/components/Toolbar.tsx
src/renderer/components/OverlayCanvas.tsx
src/renderer/components/TextStampTool.tsx
src/renderer/components/KokoMiteMarker.tsx
src/renderer/hooks/useDrawing.ts
src/renderer/hooks/useShortcuts.ts
src/renderer/utils/drawingUtils.ts
src/renderer/types/drawing.ts
Seminar Pointer.app              Finder 起動用ランチャー
Seminar Pointer.command          Finder 起動用予備ランチャー
```

---

## 次の改善候補

- 正式な `.app` ビルド化（electron-builder等で配布しやすくする）
- ツールバーをドラッグ移動可能にする
- 線の太さ変更 UI
- テキストサイズ変更 UI
- マウスポインター周囲の常時ハイライト
- Undo / Redo
- Zoom実テスト後、共有に映らない場合の方式見直し
