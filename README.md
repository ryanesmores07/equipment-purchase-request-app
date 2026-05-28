# Equipment Purchase Request App

Next.js 15 と Supabase Cloud で作成した、社内向け備品購入申請アプリケーションのプロトタイプです。

一般社員は購入申請を作成し、自分の申請だけを確認できます。管理者は全社員の申請を確認し、申請を承認または却下できます。未判断の申請については、申請者本人が編集またはキャンセルできます。

## 採用技術と理由

| 領域 | 技術 | 選定理由 |
|---|---|---|
| フレームワーク | Next.js `15.5.18` App Router | 一覧・詳細画面をサーバー側で安全に取得し、フォーム処理を Server Actions で小さく実装できるため。 |
| UI | React `19.2.4` / Tailwind CSS | 依存を増やしすぎず、レスポンシブな申請フローを短時間で実装しやすいため。 |
| 認証・DB | Supabase Cloud Auth / Postgres / RLS | 認証、ロール、DB、Row Level Security を1つの構成で再現できるため。 |
| バリデーション | Zod | フォーム入力とサーバー側検証を同じルールで扱いやすいため。 |
| テスト | Vitest | 状態遷移、入力検証、履歴表示用ロジックを軽量に検証できるため。 |
| パッケージ管理 | pnpm | lockfile による再現性を保ちやすいため。 |

Supabase は Cloud を使います。ローカル Docker は不要です。採点者は無料の Supabase プロジェクトを作成し、README の手順通りに環境変数を設定すれば動作確認できます。

## 深掘りした領域

深掘りした領域は **UI/UX とフロントエンド開発** です。

特に以下を重視しました。

- ログイン、申請一覧、申請作成、申請詳細、編集、キャンセル、管理者承認までの流れを分かりやすくすること。
- `pending` / `approved` / `rejected` / `cancelled` の状態を見分けやすくすること。
- 作成・編集・キャンセル・承認・却下後に成功メッセージを表示すること。
- 管理者向けに未対応件数とステータスフィルターを表示すること。
- 一覧・詳細・作成・編集画面に loading / error 状態を用意すること。
- モバイルでも横スクロールが出にくいレイアウトにすること。
- セマンティック HTML とサーバー側認可を組み合わせ、読みやすく保守しやすい構造にすること。

主な深掘りは UI/UX ですが、画面上の操作が実務的に成立するように、設計・ビジネスロジック面も supporting architecture として実装しました。

- Supabase RLS で、一般社員は自分の申請だけ、管理者は全申請を扱えるようにしました。
- `pending -> approved / rejected / cancelled` の状態遷移を TypeScript のドメインロジックとして整理しました。
- Zod で作成・編集・承認/却下の入力検証を行い、画面表示だけに依存しない validation にしました。
- `approval_history` と `request_activity` で、判断履歴とユーザー向けアクティビティ履歴を分けました。
- 編集時は変更前後の差分を保存し、申請詳細画面で何が変わったか確認できるようにしました。
- Vitest で状態遷移、入力検証、アクティビティ差分表示のロジックをテストしました。

つまり、主役は採点者が実際に触って確認しやすい申請ワークフローで、その信頼性を RLS・状態遷移・バリデーション・履歴・テストで支えています。

## セットアップ手順

### 1. リポジトリを取得

```bash
git clone <repository-url>
cd equipment-purchase-request-app
```

### 2. 依存関係をインストール

```bash
pnpm install
```

### 3. Supabase Cloud プロジェクトを作成

Supabase Dashboard で無料プロジェクトを作成し、以下を控えてください。

- Project URL: Project Settings > API > Project URL
- anon public key: Project Settings > API > anon public key
- service_role key: Project Settings > API > service_role key
- Project Ref: Project Settings > General > Reference ID
- Database password: プロジェクト作成時に設定したDBパスワード

### 4. 環境変数を設定

```bash
cp .env.example .env.local
```

Windows PowerShell の場合:

```powershell
Copy-Item .env.example .env.local
```

`.env.local` に Supabase の値を入れます。`SUPABASE_SERVICE_ROLE_KEY` はサーバー用の秘密鍵なので、git にコミットしないでください。

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_PROJECT_REF=<your-project-ref>
```

### 5. DBセットアップ、シード、型生成

```bash
pnpm setup
```

このコマンドは以下を実行します。

- Supabase CLI ログイン
- Supabase プロジェクトのリンク
- マイグレーション適用
- レビューユーザー作成
- Supabase 型定義生成

`supabase link` は対話式です。Project Ref と DB password を求められたら、Supabase Dashboard の値を入力してください。

### 6. アプリ起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開いてください。

## レビューユーザー

`pnpm setup` または `pnpm db:seed-users` で以下のユーザーが作成されます。値は `.env.example` にも記載しています。

| ロール | メール | パスワード |
|---|---|---|
| 一般社員1 | `employee@example.com` | `Employee123!` |
| 一般社員2 | `employee2@example.com` | `Employee234!` |
| 管理者 | `admin@example.com` | `Admin123!` |

確認手順:

1. 一般社員1でログインし、購入申請を作成します。
2. 未判断の申請を編集またはキャンセルできることを確認します。
3. 一般社員2でログインし、一般社員1の申請が表示されないことを確認します。
4. 管理者でログインし、全社員の申請が表示されることを確認します。
5. 管理者で未判断の申請を承認または却下します。
6. 申請詳細でステータスとアクティビティ履歴が更新されることを確認します。

## データ管理

DBスキーマは `supabase/migrations/` で再現できます。初期レビューユーザーは `supabase/seed-users.ts` で作成します。

主なテーブル:

| テーブル | 役割 |
|---|---|
| `profiles` | Supabase Auth ユーザーに紐づくプロフィール。`employee` または `admin` のロールを持ちます。 |
| `categories` | 申請カテゴリ。 |
| `purchase_requests` | 申請タイトル、金額、カテゴリ、説明、申請者、ステータス、判断情報を保存します。 |
| `approval_history` | 承認・却下・キャンセルなど、状態変更の監査履歴を保存します。 |
| `request_activity` | 作成・編集・キャンセル・承認・却下を、画面表示用のアクティビティ履歴として保存します。編集時は変更前後の差分も保存します。 |

状態遷移:

```text
pending -> approved
pending -> rejected
pending -> cancelled
approved -> terminal
rejected -> terminal
cancelled -> terminal
```

認可は Supabase RLS を最終防衛線にしています。

- 一般社員は自分の申請だけを閲覧できます。
- 一般社員は自分の未判断申請だけを編集・キャンセルできます。
- 管理者は全申請を閲覧できます。
- 管理者だけが承認・却下できます。
- 管理者の申請作成は、このプロトタイプでは対象外として UI、サーバー処理、RLS で止めています。

## スクリプト

| コマンド | 内容 |
|---|---|
| `pnpm dev` | 開発サーバーを起動します。 |
| `pnpm lint` | ESLint を実行します。 |
| `pnpm typecheck` | TypeScript の型チェックを実行します。 |
| `pnpm test` | ユニットテストを実行します。 |
| `pnpm test:integration` | `.env.local` を使って Supabase リポジトリ統合テストを実行します。 |
| `pnpm build` | 本番ビルドを作成します。 |
| `pnpm setup` | Supabase link、DBマイグレーション、ユーザーシード、型生成をまとめて実行します。 |
| `pnpm db:push` | Supabase マイグレーションをリンク済みプロジェクトへ適用します。 |
| `pnpm db:seed-users` | レビューユーザーを作成します。 |
| `pnpm db:types` | Supabase DB型を `types/supabase.ts` に生成します。 |

## 検証済み項目

以下はこのリポジトリで通過済みです。

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

リンク済み Supabase Cloud プロジェクトでは、マイグレーション、レビューユーザー作成、一般社員の作成・編集・キャンセル、社員間の閲覧分離、管理者の承認、履歴保存、管理者の申請作成ブロックを確認済みです。

## 妥協した点・今後追加したい点

- メールやSlack通知は未実装です。今回の範囲では申請ワークフロー本体を優先しました。
- ファイル添付は未実装です。備品購入申請では見積書添付が実務上有用ですが、今回の時間内では対象外にしました。
- 多段階承認は未実装です。金額に応じた承認ルート分岐は拡張候補です。
- ユーザー管理画面は未実装です。レビューユーザーはシードスクリプトで作成します。
- CI/CD は未実装です。ローカルで再現できるセットアップと検証コマンドを優先しました。

## 作業時間

おおよそ **6時間** です。Supabase 設定、実装、検証、README 整備を含みます。

---

## English Summary

This is a Next.js 15 + Supabase Cloud prototype for an internal equipment purchase request workflow.

Employees can create purchase requests and view only their own requests. Admins can view all requests and approve or reject pending requests. Employees can edit or cancel their own pending requests.

The primary deep-dive area is **UI/UX and front-end development**: clear request flows, visible statuses, action feedback, responsive layouts, route-level loading/error states, and reviewer-friendly interaction design. I also added supporting design/business-logic architecture through Supabase RLS, request status rules, Zod validation, audit/activity history, edit diffs, and Vitest coverage.

Setup:

```bash
git clone <repository-url>
cd equipment-purchase-request-app
pnpm install
cp .env.example .env.local
pnpm setup
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Reviewer users:

- Employee 1: `employee@example.com` / `Employee123!`
- Employee 2: `employee2@example.com` / `Employee234!`
- Admin: `admin@example.com` / `Admin123!`

Approximate working time: about 6 hours.
