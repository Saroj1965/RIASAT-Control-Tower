import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment, canViewDepartment, hasFullAccess } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deptId = parseInt(params.id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    // Access control check
    if (!canViewDepartment(user, deptId)) {
      return NextResponse.json({ error: "Access Denied: You do not have permission to view this department." }, { status: 403 });
    }

    const deptRes = await query("SELECT * FROM departments WHERE id = $1 AND active = TRUE", [deptId]);
    if (deptRes.rows.length === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }
    const department = deptRes.rows[0];

    const ovRes = await query("SELECT * FROM department_overview WHERE department_id = $1", [deptId]);
    const overview = ovRes.rows[0] || {
      readiness_percentage: 0,
      rag_status: "NOT STARTED",
      key_focus: "",
      last_updated: null,
      updated_by: null,
    };

    let items: any[] = [];
    if (department.code === "HR_REC" || department.code === "HR" || Number(deptId) === 7) {
      const recRes = await query("SELECT * FROM recruitment ORDER BY priority ASC, id ASC");
      items = recRes.rows;
    } else {
      const wsRes = await query("SELECT * FROM workstreams WHERE department_id = $1 ORDER BY id ASC", [deptId]);
      items = wsRes.rows;
    }

    const userCanEdit = canEditDepartment(user, deptId);

    return NextResponse.json({
      department,
      overview,
      items,
      workstreams: items,
      canEdit: userCanEdit,
      isExecutive: user.role === ROLES.EXECUTIVE,
      isAdmin: user.role === ROLES.ADMIN,
      isViceChairman: user.role === ROLES.VICE_CHAIRMAN || user.role === "Vice Chairman" || user.role === "Chairman",
      isChairman: user.role === ROLES.VICE_CHAIRMAN || user.role === "Vice Chairman" || user.role === "Chairman",
      hasFullAccess: hasFullAccess(user),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deptId = parseInt(params.id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    // Role-based authorization: Executive cannot edit; Dept head can only edit their own dept
    if (!canEditDepartment(user, deptId)) {
      return NextResponse.json(
        { error: "Access Denied: You are not authorized to update this department." },
        { status: 403 }
      );
    }

    const deptRes = await query("SELECT name FROM departments WHERE id = $1", [deptId]);
    if (deptRes.rows.length === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }
    const deptName = deptRes.rows[0].name;

    const { readiness_percentage, rag_status, key_focus } = await req.json();

    const oldOvRes = await query("SELECT * FROM department_overview WHERE department_id = $1", [deptId]);
    const oldOverview = oldOvRes.rows[0] || {};

    const readiness = Math.max(0, Math.min(100, parseInt(readiness_percentage || "0", 10)));
    const rag = ["GREEN", "AMBER", "RED", "NOT STARTED"].includes(rag_status) ? rag_status : "NOT STARTED";

    const updateRes = await query(
      `INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, last_updated, updated_by)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
       ON CONFLICT (department_id) 
       DO UPDATE SET 
         readiness_percentage = EXCLUDED.readiness_percentage,
         rag_status = EXCLUDED.rag_status,
         key_focus = EXCLUDED.key_focus,
         last_updated = CURRENT_TIMESTAMP,
         updated_by = EXCLUDED.updated_by
       RETURNING *`,
      [deptId, readiness, rag, key_focus || "", user.name]
    );

    const updatedOverview = updateRes.rows[0];

    // Audit log
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_OVERVIEW",
      departmentId: deptId,
      departmentName: deptName,
      oldValue: JSON.stringify({
        readiness: oldOverview.readiness_percentage,
        rag: oldOverview.rag_status,
      }),
      newValue: JSON.stringify({
        readiness: updatedOverview.readiness_percentage,
        rag: updatedOverview.rag_status,
      }),
      details: `${user.name} (${user.role}) updated ${deptName} overview: Readiness=${readiness}%, RAG=${rag}`,
    });

    return NextResponse.json({
      success: true,
      overview: updatedOverview,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user || !hasFullAccess(user)) {
      return NextResponse.json(
        { error: "Access Denied: Vice Chairman or Admin required to delete departments." },
        { status: 403 }
      );
    }

    const deptId = parseInt(params.id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    if (deptId <= 9) {
      return NextResponse.json(
        { error: "Core RIASAT strategic verticals cannot be deleted." },
        { status: 400 }
      );
    }

    await query("DELETE FROM workstreams WHERE department_id = $1", [deptId]);
    await query("DELETE FROM department_overview WHERE department_id = $1", [deptId]);
    await query("DELETE FROM department_form_values WHERE department_id = $1", [deptId]);
    await query("DELETE FROM form_fields WHERE department_id = $1", [deptId]);
    await query("DELETE FROM form_sections WHERE department_id = $1", [deptId]);
    await query("DELETE FROM departments WHERE id = $1", [deptId]);

    return NextResponse.json({ success: true, message: `Department ${deptId} deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

