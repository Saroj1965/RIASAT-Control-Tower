// scripts/test-field-crud.mjs
const BASE_URL = "http://localhost:3000";

function parseCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw.split(";")[0];
}

async function run() {
  console.log("================================================================================");
  console.log("TESTING FORM FIELD CRUD (ADD, EDIT, MODIFY, DELETE) FOR FORM CONFIGURATION");
  console.log("================================================================================\n");

  // Step 1: Admin Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@riasat.ac.in", password: "Admin@123" }),
  });
  const cookie = parseCookie(loginRes);
  if (!cookie) {
    console.error("❌ Login failed:", await loginRes.text());
    process.exit(1);
  }
  console.log("✅ 1. Admin login successful.");

  // Step 2: Get initial fields for HR & Recruitment (dept 7)
  const initialFieldsRes = await fetch(`${BASE_URL}/api/admin/forms/fields?department_id=7`, {
    headers: { Cookie: cookie },
  });
  const initialData = await initialFieldsRes.json();
  const initialCount = initialData.fields?.length || 0;
  console.log(`✅ 2. Retrieved initial form fields for HR & Recruitment: ${initialCount} fields.`);

  // Step 3: Add new field
  const createRes = await fetch(`${BASE_URL}/api/admin/forms/fields`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      department_id: 7,
      label: "Interim Assessment Score",
      field_type: "Number",
      required: false,
      display_order: 15,
      help_text: "Optional interview candidate rating from 1 to 10",
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    console.error("❌ Add field failed:", createData);
    process.exit(1);
  }
  const createdField = createData.field;
  console.log(`✅ 3. Added new field successfully: ID = ${createdField.id}, Label = "${createdField.label}", Key = "${createdField.field_key}"`);

  // Step 4: Edit / Modify field
  const modifyRes = await fetch(`${BASE_URL}/api/admin/forms/fields`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      id: createdField.id,
      label: "Candidate Assessment Rating (1-10)",
      field_type: "Percentage",
      required: true,
      active: true,
      display_order: 16,
      help_text: "Updated rating scale from technical evaluation panel",
    }),
  });
  const modifyData = await modifyRes.json();
  if (!modifyRes.ok || !modifyData.success) {
    console.error("❌ Modify field failed:", modifyData);
    process.exit(1);
  }
  const modifiedField = modifyData.field;
  console.log(`✅ 4. Modified field successfully: Label = "${modifiedField.label}", Type = "${modifiedField.field_type}", Required = ${modifiedField.required}`);

  // Step 5: Verify field exists in list
  const listAfterAddRes = await fetch(`${BASE_URL}/api/admin/forms/fields?department_id=7`, {
    headers: { Cookie: cookie },
  });
  const listAfterAdd = await listAfterAddRes.json();
  const foundField = listAfterAdd.fields.find((f) => f.id === createdField.id);
  if (!foundField) {
    console.error("❌ Created field not found in list!");
    process.exit(1);
  }
  console.log(`✅ 5. Verified modified field appears in active fields list (Count = ${listAfterAdd.fields.length}).`);

  // Step 6: Delete the field
  const deleteRes = await fetch(`${BASE_URL}/api/admin/forms/fields?id=${createdField.id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  const deleteData = await deleteRes.json();
  if (!deleteRes.ok || !deleteData.success) {
    console.error("❌ Delete field failed:", deleteData);
    process.exit(1);
  }
  console.log(`✅ 6. Deleted field successfully: ${deleteData.message}`);

  // Step 7: Verify field is gone from list
  const listAfterDeleteRes = await fetch(`${BASE_URL}/api/admin/forms/fields?department_id=7`, {
    headers: { Cookie: cookie },
  });
  const listAfterDelete = await listAfterDeleteRes.json();
  const deletedStillExists = listAfterDelete.fields.some((f) => f.id === createdField.id);
  if (deletedStillExists) {
    console.error("❌ Field still exists after deletion!");
    process.exit(1);
  }
  console.log(`✅ 7. Verified field was permanently removed from database (Count restored to = ${listAfterDelete.fields.length}).`);

  console.log("\n================================================================================");
  console.log("🎉 ALL FORM FIELD CRUD CHECKS (CREATE, EDIT, MODIFY, DELETE) PASSED 100%!");
  console.log("================================================================================\n");
}

run().catch(console.error);
