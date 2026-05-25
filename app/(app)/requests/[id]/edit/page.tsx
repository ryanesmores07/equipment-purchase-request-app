import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditRequestForm } from "@/components/edit-request-form";
import { requireUser } from "@/lib/auth/require-user";
import { listCategories } from "@/lib/repositories/categories.repo";
import { getRequestById } from "@/lib/repositories/requests.repo";

export default async function EditRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const [request, categories] = await Promise.all([
    getRequestById(supabase, id),
    listCategories(supabase),
  ]);

  if (!request) {
    notFound();
  }

  if (request.applicant_id !== user.id || request.status !== "pending") {
    redirect(`/requests/${request.id}`);
  }

  return (
    <section className="grid gap-6">
      <div>
        <Link
          className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
          href={`/requests/${request.id}`}
        >
          申請詳細に戻る
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">申請を編集</h1>
        <p className="text-sm text-zinc-600">
          管理者が判断する前の申請だけ編集できます。
        </p>
      </div>
      <EditRequestForm categories={categories} request={request} />
    </section>
  );
}
