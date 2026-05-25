import Link from "next/link";
import { CreateRequestForm } from "@/components/create-request-form";
import { requireUser } from "@/lib/auth/require-user";
import { listCategories } from "@/lib/repositories/categories.repo";

export default async function NewRequestPage() {
  const { supabase } = await requireUser();
  const categories = await listCategories(supabase);

  return (
    <section className="grid gap-6">
      <div>
        <Link
          className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
          href="/requests"
        >
          申請一覧に戻る
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">
          新規購入申請
        </h1>
        <p className="text-sm text-zinc-600">
          備品、ソフトウェア、学習教材などの購入内容を入力してください。
        </p>
      </div>
      <CreateRequestForm categories={categories} />
    </section>
  );
}
