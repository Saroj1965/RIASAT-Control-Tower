import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, canManageDepartments } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSupabaseClient();
    const [
      { data: deptsData },
      { data: ovData },
      { data: wsData },
      { data: recData },
    ] = await Promise.all([
      sb.from("departments").select("*").eq("active", true).order("id", { ascending: true }),
      sb.from("department_overview").select("*"),
      sb.from("workstreams").select("department_id, status"),
      sb.from("recruitment").select("status, priority"),
    ]);

    const ovMap = new Map<number, any>();
    for (const o of ovData || []) {
      ovMap.set(Number(o.department_id), o);
    }

    const statsMap: Record<number, { total_count: number; open_count: number; completed_count: number; delayed_count: number }> = {};
    for (const w of wsData || []) {
      const dId = Number(w.department_id);
      if (!statsMap[dId]) {
        statsMap[dId] = { total_count: 0, open_count: 0, completed_count: 0, delayed_count: 0 };
      }
      statsMap[dId].total_count++;
      if (!["Completed", "On Hold", "CLOSED", "Closed"].includes(w.status)) {
        statsMap[dId].open_count++;
      }
      if (["Completed", "CLOSED", "Closed"].includes(w.status)) {
        statsMap[dId].completed_count++;
      }
      if (["Delayed", "Blocked"].includes(w.status)) {
        statsMap[dId].delayed_count++;
      }
    }

    const recs = recData || [];
    const hrStat = {
      total_count: recs.length,
      open_count: recs.filter((r: any) => !["Joined", "Closed"].includes(r.status)).length,
      completed_count: recs.filter((r: any) => r.status === "Joined").length,
      delayed_count: recs.filter((r: any) => r.priority === "Critical" && !["Joined", "Closed"].includes(r.status)).length,
    };

    const departments = (deptsData || []).map((d: any) => {
      const ov = ovMap.get(Number(d.id)) || {};
      const stats = d.code === "HR_REC" ? hrStat : (statsMap[Number(d.id)] || { total_count: 0, open_count: 0, completed_count: 0, delayed_count: 0 });

      let updateRequired = false;
      if (!ov.last_updated) {
        updateRequired = true;
      } else {
        const lastDate = new Date(ov.last_updated).getTime();
        const diffDays = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) {
          updateRequired = true;
        }
      }

      return {
        ...d,
        readiness_percentage: ov.readiness_percentage ?? 0,
        rag_status: ov.rag_status ?? "NOT STARTED",
        key_focus: ov.key_focus ?? "",
        last_updated: ov.last_updated ?? null,
        updated_by: ov.updated_by ?? null,
        stats: {
          total: stats.total_count,
          open: stats.open_count,
          completed: stats.completed_count,
          delayed: stats.delayed_count,
        },
        updateRequired,
      };
    });

    return NextResponse.json({ departments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !canManageDepartments(user)) {
      return NextResponse.json({ error: "Access Denied: Department Administrator privileges required." }, { status: 403 });
    }

    const { name, code } = await req.json();
    if (!name || !code) {
      return NextResponse.json({ error: "Department name and unique code are required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "_");
    const sb = getSupabaseClient();

    const { data: maxDept } = await sb.from("departments").select("id").order("id", { ascending: false }).limit(1);
    const nextId = maxDept && maxDept.length > 0 ? Number(maxDept[0].id) + 1 : 10;

    const { data: newDept, error: insError } = await sb
      .from("departments")
      .insert({ id: nextId, name: name.trim(), code: cleanCode, active: true })
      .select("*")
      .single();

    if (insError || !newDept) {
      return NextResponse.json({ error: insError?.message || "Failed to create department" }, { status: 500 });
    }

    // Create default overview entry
    await sb.from("department_overview").upsert(
      {
        department_id: newDept.id,
        readiness_percentage: 0,
        rag_status: "NOT STARTED",
        key_focus: "Initial Setup",
        updated_by: user.name,
        submission_status: "DRAFT",
        last_updated: new Date().toISOString(),
      },
      { onConflict: "department_id" }
    );

    // Seed default overview section and 3 standard initial fields for the new department
    try {
      const { data: secRow } = await sb
        .from("form_sections")
        .insert({
          department_id: newDept.id,
          section_key: "overview_section",
          title: "Sector Overview & Vice Chairman Focus / Decision Required",
          display_order: 1,
          active: true,
        })
        .select("id")
        .single();

      const sectionId = secRow?.id;
      if (sectionId) {
        const defaultFields = [
          { key: "readiness_score", label: "Readiness Score", type: "Percentage", req: true, order: 1, help: "0-100 percentage" },
          { key: "rag_status", label: "RAG Status", type: "RAG Status", req: true, order: 2, help: "Current operational RAG status" },
          { key: "vc_focus_decision", label: "Vice Chairman Focus / Decision", type: "Long Text", req: false, order: 3, help: "Direct decisions required from Vice Chairman" },
        ];

        for (const f of defaultFields) {
          await sb.from("form_fields").insert({
            department_id: newDept.id,
            section_id: sectionId,
            field_key: f.key,
            label: f.label,
            field_type: f.type,
            required: f.req,
            active: true,
            display_order: f.order,
            help_text: f.help,
          });
        }
      }
    } catch (formErr) {
      console.warn("Could not seed default form fields for new department:", formErr);
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "CREATE_DEPARTMENT",
      departmentId: newDept.id,
      departmentName: newDept.name,
      details: `Admin created new department: ${newDept.name} (${newDept.code})`,
    });

    return NextResponse.json({ success: true, department: newDept });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
