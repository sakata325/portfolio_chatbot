# 実装チェックリスト

このドキュメントは、Portfolio-ChatBot プロジェクトの実装手順を機能単位で記述したものです。
各機能単位の実装完了後に確認・合意を得ながら進めます。

## 1. [X] バックエンド基盤構築
    *   Git リポジトリ、基本的なディレクトリ構造 (`backend/`, `frontend/`, `.github/workflows/`)、`.gitignore`、`README.md` を初期化する。
    *   `backend/.env.example` を作成し、環境変数を定義する。 (注: 作成時に ignore 設定で問題発生、手動作成推奨)
    *   `backend/` で Poetry を初期化し (`python = "^3.12"` を指定)、必要な依存関係 (`fastapi`, `uvicorn`, `pydantic`, `requests`, `beautifulsoup4`, `google-genai`, etc.) をインストールする。
    *   FastAPI の基本構成 (`app/main.py`, `app/api/`, `app/models.py`, `app/prompt_store.py` など) を作成する。
    *   Pydantic モデル (`ChatRequest`, `ChatResponse`, `PromptUpdate`, `PromptRecord`) を定義する。
    *   インメモリの `PromptStore` を実装する。
    *   最小限の FastAPI サーバーが起動することを確認する。

**(機能単位 1 完了確認)**

---

## 2. [X] バックエンド API 実装
    *   `backend/.env` ファイルに `GOOGLE_API_KEY` を設定する (gitignore 対象)。
    *   `/api/chat` (POST) エンドポイントを実装し、Gemini API (`google-genai`) と連携して応答を返すようにする。
    *   `/api/prompt/update` (PATCH) エンドポイントを実装し、`prompt_store` を更新できるようにする。
    *   FastAPI サーバーを起動し、HTTP クライアントで両エンドポイントの動作を確認する。

**(機能単位 2 完了確認)**

---

## 3. [ ] クロール & 差分更新ツール実装
    *   `backend/tools/crawl_and_patch.py` を実装し、指定 URL からテキストを抽出、ハッシュ化、差分比較を行う。
    *   `backend/.env` に `PORTFOLIO_URL` と `CHATBOT_HOST` (ローカル) を設定する。
    *   差分がある場合に `/api/prompt/update` を呼び出す処理を追加する。
    *   スクリプトが Poetry 経由 (`poetry run crawl-and-patch`) で実行できることを確認する。
    *   ローカル環境でスクリプトを実行し、差分検知と API 呼び出しが正しく動作することを確認する。

**(機能単位 3 完了確認)**

---

## 4. [ ] フロントエンド基盤構築と実装
    *   `frontend/` で React + TypeScript プロジェクト (Vite 等) を初期化する。
    *   必要な依存関係 (`@mui/material`, `react-chat-widget`, etc.) をインストールする。
    *   基本的な React アプリが表示されることを確認する。
    *   `ChatWidget.tsx` コンポーネントを作成し、`react-chat-widget` を用いて UI を実装する。
    *   `handleNewUserMessage` 内で、バックエンドの `/api/chat` エンドポイントと連携する処理を実装する。
    *   Vite のプロキシ設定などを行い、ローカル開発環境でフロントエンドとバックエンドが連携して動作することを確認する。

**(機能単位 4 完了確認)**

---

## 5. [ ] CI/CD パイプライン構築
    *   バックエンド用の GitHub Actions ワークフロー (`.github/workflows/ci-cd-backend.yml`) を作成する (テスト、Railway へのデプロイ)。
    *   フロントエンド用の GitHub Actions ワークフロー (`.github/workflows/ci-cd-frontend.yml`) を作成する (ビルド、Vercel へのデプロイ)。
    *   必要な Secrets (`RAILWAY_API_TOKEN`, `VERCEL_TOKEN`, `GOOGLE_API_KEY`, `PORTFOLIO_URL`, デプロイ後の `CHATBOT_HOST`) を GitHub リポジトリに設定する。
    *   バックエンドのワークフローに、スケジュール実行 (`cron`) で `crawl-and-patch` を実行するステップを追加する。Cron ジョブがデプロイされたバックエンドを参照するように設定する。
    *   `main` ブランチへのプッシュ、または手動トリガーにより、各 CI/CD パイプラインが正常に動作し、それぞれのプラットフォームへデプロイされることを確認する。
    *   Cron ジョブがスケジュール通りに実行され、デプロイ環境のプロンプトが更新される (または変更がない場合はスキップされる) ことを確認する。

**(機能単位 5 完了確認)**

---

## 6. [ ] 最終調整、テスト、ドキュメント化
    *   デプロイされたフロントエンドの URL を使用して iframe タグを作成し、STUDIO 等に埋め込んで動作を確認する。
    *   複数の会話シナリオで QA を実施する。
    *   ポートフォリオサイトの更新 → Cron による自動更新 → チャット応答の変化、という一連の流れを確認する。
    *   `README.md` と `document.md` を最終化し、プロジェクトの概要、使い方、設定、デプロイ手順などを正確に記述する。

**(全機能単位完了)** 