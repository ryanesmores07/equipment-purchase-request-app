# Equipment Purchase Request App

Next.js 15 + Supabase で作成した、社内備品購入申請のプロトタイプです。

社員は備品・ソフトウェア・学習教材などの購入申請を作成できます。管理者は全申請を確認し、未承認の申請を承認または却下できます。申請詳細では承認履歴も確認できます。

## 技術スタック

- Next.js `15.5.18` App Router
- React Server Components によるサーバー側データ取得
- Server Actions によるフォーム送信・更新処理
- Supabase Cloud: Auth、Postgres、Row Level Security、マイグレーション、型生成
- TypeScript、Tailwind CSS、ESLint、Zod、Vitest、pnpm

Supabase Cloud を使うため、ローカル Docker は不要です。レビュアーは無料の Supabase プロジェクトと `.env.local` を用意すれば動作確認できます。

## 重点領域

選択した重点領域は **UI/UX とフロントエンド開発** です。

主な実装内容:

- ログイン、申請一覧、申請作成、申請詳細、管理者承認パネルまでの一連の申請フロー
- `pending`、`approved`、`rejected` の状態が分かりやすい表示
- 申請詳細での承認履歴表示
- 入力項目に近い位置でのバリデーションエラー表示
- レスポンシブな画面レイアウト
- ルート単位の loading / error 状態
- Supabase RLS による社員・管理者の表示範囲制御
- Zod と TypeScript による入力検証・状態遷移チェック
- Vitest による状態遷移とバリデーションのユニットテスト

## データモデル

- `profiles`: Supabase Auth ユーザーに紐づくプロフィール。`employee` または `admin` ロールを持ちます。
- `categories`: 申請カテゴリ。
- `purchase_requests`: 申請内容と `pending` / `approved` / `rejected` の承認状態。
- `approval_history`: 管理者が状態を変更したときに追加される監査履歴。

状態遷移はシンプルにしています。

```text
pending -> approved
pending -> rejected
approved -> terminal
rejected -> terminal
```

却下時は理由の入力が必須です。作成済みの申請内容は編集不可です。

## セットアップ

必要なもの:

- Node.js 20 以上
- pnpm
- 無料の Supabase Cloud プロジェクト

依存関係をインストールします。

```bash
pnpm install
```

環境変数ファイルを作成します。

```bash
cp .env.example .env.local
```

Windows PowerShell の場合:

```powershell
Copy-Item .env.example .env.local
```

`.env.local` に Supabase の値を設定します。

- `NEXT_PUBLIC_SUPABASE_URL`: Project Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings > API > anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Project Settings > API > service_role key
- `SUPABASE_PROJECT_REF`: Project Settings > General > Reference ID

`SUPABASE_SERVICE_ROLE_KEY` は `.env.local` のみに保存してください。Git にコミットしないでください。

Supabase にログインし、プロジェクトをリンクして、マイグレーション・レビュアーユーザー作成・型生成を実行します。

```bash
pnpm setup
```

`supabase link` は対話形式です。表示に従って Supabase プロジェクトを選択するか、Project Ref とデータベースパスワードを入力してください。

開発サーバーを起動します。

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

## レビュアーユーザー

シードスクリプトは `.env.local` の値を読み取ります。以下は `.env.example` に入っているレビュアー用テストユーザー情報で、そのまま使えます。

- 社員: `employee@example.com` / `Employee123!`
- 管理者: `admin@example.com` / `Admin123!`

確認手順:

1. 社員ユーザーでログインします。
2. `/requests/new` から購入申請を作成します。
3. ログアウトし、管理者ユーザーでログインします。
4. 申請詳細ページを開きます。
5. 未承認の申請を承認または却下します。
6. 状態表示と承認履歴が更新されていることを確認します。

## スクリプト

- `pnpm dev`: 開発サーバーを起動します。
- `pnpm lint`: ESLint を実行します。
- `pnpm typecheck`: TypeScript の型チェックを実行します。
- `pnpm test`: ユニットテストを実行します。
- `pnpm test:integration`: `.env.local` を使ったリポジトリ統合テスト用の予約スクリプトです。
- `pnpm build`: 本番ビルドを作成します。
- `pnpm setup`: Supabase ログイン・リンク、マイグレーション適用、ユーザー作成、DB 型生成を実行します。
- `pnpm db:push`: Supabase マイグレーションをリンク済みプロジェクトへ適用します。
- `pnpm db:seed-users`: 社員・管理者ユーザーを作成します。
- `pnpm db:types`: Supabase の DB 型を再生成します。

## 検証済み項目

以下は通過済みです。

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

リンク済み Supabase Cloud プロジェクトでも、マイグレーション適用、レビュアーユーザー作成、社員の申請作成、管理者の承認フロー、承認履歴の保存を確認済みです。

## 既知の制限

- メール通知、ファイル添付、多段階承認は未実装です。
- ユーザー管理画面はありません。レビュアーユーザーは `supabase/seed-users.ts` で作成します。
- 見た目の装飾は最小限です。フロントエンドの重点は、申請フローの分かりやすさ、アクセシビリティ、レビュアーが確認しやすい操作性です。
- 自動テストはドメインロジックとバリデーションを対象にしています。Supabase リポジトリの挙動は、リンク済み Cloud プロジェクトでの実操作により確認しました。

作業時間の目安: Supabase 設定、検証、ドキュメント整備を含めて、約 6 時間です。

---

## English Summary

This is a Next.js 15 + Supabase prototype for an internal equipment purchase request workflow.

Employees can create purchase requests. Admins can review all requests, approve or reject pending requests, and see approval history.

The selected deep-dive area is **UI/UX and front-end development**. The main reviewer-facing focus is the request workflow: login, request list, request creation, detail view, admin approval panel, clear statuses, validation feedback, responsive layout, and route-level loading/error states.

Setup summary:

```bash
pnpm install
cp .env.example .env.local
pnpm setup
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Reviewer users:

- Employee: `employee@example.com` / `Employee123!`
- Admin: `admin@example.com` / `Admin123!`

Approximate working time: about 6 hours, including Supabase setup, verification, and documentation.

Verified checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
