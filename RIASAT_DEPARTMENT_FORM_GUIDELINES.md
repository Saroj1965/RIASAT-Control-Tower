# RIASAT Control Tower: Complete Workstream Form Filing Guidelines

> **Ramaiah Institute for Advanced Skills & Technology (RIASAT)**  
> *Executive Decision Support & Management Control Tower*  
> Document Version: 2.0 | Operational & Commissioning Standards 2026–2027  

This guideline details the exact standards, formats, and best practices for completing each of the **11 core workstream columns** from the RIASAT Executive Control Tower blueprint:

```
Item_ID | Workstream_Category | Deliverable_Milestone | Key_Assets_Partnerships_Infrastructure | Target_Date | Status and Actions | Capex_Budget_Cr | Revenue_Pipeline_Cr | Lead_Owner | Risks_Operational_Blockers | Vice_Chairman_Decision_Action
```

---

## 1. Field-by-Field Filling Guidelines

### 1. `Item_ID`
- **Definition**: The unique sequential identifier for the workstream deliverable within the department.
- **Format**: Automatically tracked in the database and displayed as `WS-01`, `WS-02`, etc. When planning or referencing in meetings, use the department prefix code:
  - Semicon: `SEM-WS-01`
  - Aerospace & Defence: `AERO-WS-01`
  - Space: `SPC-WS-01`
  - Cybersecurity: `CYB-WS-01`
  - MedTech: `MED-WS-01`
  - Advanced Manufacturing: `MFG-WS-01`
  - Communications: `COMM-WS-01`
- **Rule**: Never leave blank. Serves as the tracking index for the Vice Chairman during executive reviews.

---

### 2. `Workstream_Category`
- **Definition**: The thematic operational bucket to which this milestone belongs.
- **Allowed / Recommended Categories**:
  - `Infrastructure`: Physical facilities, civil works, HVAC, cleanrooms, server racks, labs.
  - `Lab Equipment & Tooling`: Hardware instruments, test benches, machinery, CAD/EDA compute.
  - `Curriculum & Academics`: Syllabus design, course accreditation, diploma programs, faculty modules.
  - `Industry Partnerships`: Corporate MoUs, vendor alliances, anchor consortia, client agreements.
  - `Certifications & Regulatory`: Regulatory approvals (e.g. ISO 13485, CERT-In, DGCA, IN-SPACe).
  - `Monetization & Commercial`: Corporate training batches, testing services, consulting revenue.
- **Mistake to Avoid**: Do not use vague terms like *"General"* or *"Misc"*. Always use one of the standard categories above.

---

### 3. `Deliverable_Milestone`
- **Definition**: A concrete, verifiable outcome describing what is being commissioned, built, or delivered.
- **How to write**: Must start with an action noun or verb stating a tangible deliverable. Include capacity, node count, or specification where applicable.
- **Good Examples**:
  - *"Commissioning of ISO-6 Cleanroom with Laminar Flow HVAC & Gas Lines"*
  - *"Provisioning of 250-Node EDA Cloud Licensing Server Farm"*
  - *"Avionics Hardware-in-the-Loop (HIL) Flight Simulation Rig Setup"*
  - *"100-Seat Student Cyber Range Attack-Defense Simulator Deployment"*
- **Bad Examples**:
  - ❌ *"Working on cleanroom"* (Vague, non-verifiable)
  - ❌ *"Talk to partners"* (Activity, not a milestone)

---

### 4. `Key_Assets_Partnerships_Infrastructure`
- **Definition**: The key technology partners, equipment OEMs, universities, or external agencies directly involved in executing this deliverable.
- **How to write**: List the company/agency name and specific tooling or asset acquired.
- **Good Examples**:
  - *"Cadence EDA Suite / Hewlett Packard Enterprise ProLiant DL380"*
  - *"HAL Avionics Division / BEL Radar Testbed"*
  - *"ISRO IN-SPACe / Dhruva Space Ground Station Dish"*
  - *"Fortinet / Palo Alto Networks Cyber Range Appliance"*
  - *"Dassault Systèmes 3DEXPERIENCE Platform (60 Cloud Seats)"*
  - *"Ramaiah Medical College & Hospital — Clinical Simulation Ward"*
- **Mistake to Avoid**: Do not leave empty if an external partner or equipment vendor is required.

---

### 5. `Target_Date`
- **Definition**: The firm commitment date for deliverable completion or phase sign-off.
- **Format**: Standard ISO date format `YYYY-MM-DD` (e.g., `2026-11-30`).
- **Rules**:
  - Must be a specific date, not a quarter or month name (e.g., use `2026-12-15`, not *"mid-December"*).
  - If a milestone is rescheduled, update this date and document the rationale under `Risks_Operational_Blockers`.

---

### 6. `Status and Actions`
- **Definition**: The current operational execution stage. Feeds the Gantt chart and Executive Dashboard filters.
- **Standard Allowed Values**:
  - `Not Started`: Planned milestone; procurement or preparation has not yet initiated.
  - `In Progress`: Active work underway; procurement/installation is proceeding normally.
  - `On Track`: Progressing ahead of or exactly on schedule with no anticipated delays.
  - `Delayed`: Execution has missed or will miss the target date by 1–4 weeks. Requires documented mitigation in `Risks_Operational_Blockers`.
  - `Blocked`: Work is completely halted due to external dependency, vendor default, regulatory hold, or lack of budget. Automatically escalates to Management Attention.
  - `Completed`: 100% delivered, commissioned, and verified.
  - `On Hold`: Temporarily paused by management directive.

---

### 7. `Capex_Budget_Cr`
- **Definition**: Capital expenditure required for procurement, civil modification, software licenses, or instrumentation.
- **Format**: Numeric value expressed in **₹ Crores** (e.g., `₹ 4.5 Cr`, `14.5`, or `0.8`).
- **Rules**:
  - Use `₹ 0.0 Cr` (or `0`) if the milestone is academic curriculum development or partnership coordination that incurs no capital expenditure.
  - Do not write in Lakhs directly (e.g., write ₹50 Lakhs as `₹ 0.5 Cr`).

---

### 8. `Revenue_Pipeline_Cr`
- **Definition**: Anticipated commercial value, corporate training revenue, sponsored research funding, or student tuition generated by this asset over a 1–3 year horizon.
- **Format**: Numeric value expressed in **₹ Crores** (e.g., `₹ 25.0 Cr`, `12.0`, or `0.0`).
- **Rules**:
  - If the asset is purely internal infrastructure (e.g., central backup power), set to `₹ 0.0 Cr`.
  - For revenue-generating capabilities (e.g., corporate VLSI batches, Cyber Pentest Lab, 3D printing commercial bureau), enter the realistic projected pipeline.

---

### 9. `Lead_Owner`
- **Definition**: The specific person directly accountable for delivery of this workstream.
- **Format**: Official institutional role or designation:
  - Preferred: `"Semicon Head"`, `"Aerospace & Defence Head"`, `"Lead Lab Engineer"`, `"Programme Director - VLSI"`
  - Or specific designated faculty name if already assigned.
- **Mistake to Avoid**: Avoid generic teams like *"Dept Team"* or *"Everyone"*. There must always be a single accountable lead.

---

### 10. `Risks_Operational_Blockers`
- **Definition**: Active technical, supply-chain, regulatory, or civil bottlenecks threatening milestone completion.
- **How to write**: State the root cause, impacted dependency, and timeline impact clearly.
- **Good Examples**:
  - *"Argon gas supply line contractor delayed by 3 weeks due to import clearance at Chennai port."*
  - *"Customs duty exemption certificate pending sign-off from Ministry of Finance."*
  - *"HVAC filtration vendor missed milestone delivery window; liquidated damages clause under review."*
- **If no blockers exist**: Enter `"None"` or leave as `"--"`.

---

### 11. `Vice_Chairman_Decision_Action`
- **Definition**: Specific action, policy sign-off, or external liaison required from the **Vice Chairman**.
- **Crucial Rule**: Items entered here are extracted automatically into the **Executive Dashboard Management Attention Table**.
- **Good Examples**:
  - *"VC sign-off required for vendor penalty waiver to prevent work stoppage."*
  - *"Request VC liaison with DRDO Director General for propulsion test rig access agreement."*
  - *"VC approval required for ₹45L emergency air freight shipping authorization."*
  - *"VC signature required on IN-SPACe Master Research MoU."*
- **If no leadership action needed**: Enter `"None"` or leave as `"--"`.

---

## 2. Complete Row Templates Across All Strategic Verticals

Below are standardized reference rows showing how each department should structure its workstreams:

### Semicon (Dept 1)
```
Item_ID:                                WS-01
Workstream_Category:                    Infrastructure
Deliverable_Milestone:                  Cleanroom ISO-5/6 HVAC Commissioning & Certification
Key_Assets_Partnerships_Infrastructure: Cadence / Applied Materials clean air filtration
Target_Date:                            2026-11-15
Status and Actions:                     Delayed
Capex_Budget_Cr:                        ₹ 14.5 Cr
Revenue_Pipeline_Cr:                    ₹ 28.0 Cr
Lead_Owner:                             Semicon Head
Risks_Operational_Blockers:             HEPA filtration vendor delivery delayed by 2 weeks
Vice_Chairman_Decision_Action:          VC approval requested for expedited air shipping waiver
```

---

### Aerospace & Defence (Dept 2)
```
Item_ID:                                WS-01
Workstream_Category:                    Infrastructure
Deliverable_Milestone:                  Avionics Hardware-in-the-Loop (HIL) Flight Simulator Lab
Key_Assets_Partnerships_Infrastructure: HAL Avionics Division / National Instruments
Target_Date:                            2026-11-20
Status and Actions:                     On Track
Capex_Budget_Cr:                        ₹ 8.5 Cr
Revenue_Pipeline_Cr:                    ₹ 18.0 Cr
Lead_Owner:                             Aerospace & Defence Head
Risks_Operational_Blockers:             Component customs clearance pending at Bengaluru airport
Vice_Chairman_Decision_Action:          Duty exemption certificate submitted for VC signature
```

---

### Space (Dept 3)
```
Item_ID:                                WS-01
Workstream_Category:                    Infrastructure
Deliverable_Milestone:                  Ground Station & CubeSat Telemetry Dish Installation
Key_Assets_Partnerships_Infrastructure: ISRO IN-SPACe / Dhruva Space
Target_Date:                            2026-11-10
Status and Actions:                     On Track
Capex_Budget_Cr:                        ₹ 6.0 Cr
Revenue_Pipeline_Cr:                    ₹ 12.0 Cr
Lead_Owner:                             Space Head
Risks_Operational_Blockers:             Rooftop civil reinforcement load-bearing audit complete
Vice_Chairman_Decision_Action:          VC signature required on IN-SPACe Master Authorization
```

---

### Cybersecurity (Dept 4)
```
Item_ID:                                WS-01
Workstream_Category:                    Equipment & Tooling
Deliverable_Milestone:                  Enterprise Simulation Cyber Range (100 Student Seats)
Key_Assets_Partnerships_Infrastructure: Fortinet / Palo Alto Networks / Dell Server Stack
Target_Date:                            2026-10-30
Status and Actions:                     On Track
Capex_Budget_Cr:                        ₹ 5.2 Cr
Revenue_Pipeline_Cr:                    ₹ 25.0 Cr
Lead_Owner:                             Cybersecurity Head
Risks_Operational_Blockers:             Dedicated 10 Gbps ISP fiber pipe required for attack simulation
Vice_Chairman_Decision_Action:          VC approval required for annual leased line ISP contract
```

---

### MedTech (Dept 5)
```
Item_ID:                                WS-01
Workstream_Category:                    Infrastructure
Deliverable_Milestone:                  Hospital Bio-Telemetry & Patient Simulator Facility
Key_Assets_Partnerships_Infrastructure: Ramaiah Medical College & Hospital Simulation Ward
Target_Date:                            2026-10-28
Status and Actions:                     Delayed
Capex_Budget_Cr:                        ₹ 9.0 Cr
Revenue_Pipeline_Cr:                    ₹ 19.0 Cr
Lead_Owner:                             MedTech Head
Risks_Operational_Blockers:             Hospital ward plumbing and medical gas line retrofit delayed
Vice_Chairman_Decision_Action:          VC liaison requested with Medical Director for work order sign-off
```

---

### Advanced Manufacturing (Dept 6)
```
Item_ID:                                WS-01
Workstream_Category:                    Equipment & Tooling
Deliverable_Milestone:                  Direct Metal Laser Sintering (DMLS) 3D Printing Lab
Key_Assets_Partnerships_Infrastructure: EOS GmbH / Renishaw Metrology
Target_Date:                            2026-10-18
Status and Actions:                     On Track
Capex_Budget_Cr:                        ₹ 11.0 Cr
Revenue_Pipeline_Cr:                    ₹ 32.0 Cr
Lead_Owner:                             Advanced Manufacturing Head
Risks_Operational_Blockers:             Argon gas delivery pipeline manifold installation
Vice_Chairman_Decision_Action:          None
```

---

### Communications (Dept 8)
```
Item_ID:                                WS-01
Workstream_Category:                    Alliances & Outreach
Deliverable_Milestone:                  National Advanced Skills Summit & Industry Round Table
Key_Assets_Partnerships_Infrastructure: CII / FICCI / IESA Industry Alliances
Target_Date:                            2026-11-28
Status and Actions:                     In Progress
Capex_Budget_Cr:                        ₹ 1.5 Cr
Revenue_Pipeline_Cr:                    ₹ 5.0 Cr
Lead_Owner:                             Communications Head
Risks_Operational_Blockers:             Keynote confirmations pending from 4 semiconductor CEOs
Vice_Chairman_Decision_Action:          VC invitation letter dispatch to 20 Chief Executive Officers
```

---

## 3. How Entered Workstreams Update the Executive Dashboard

When a Department Head saves a workstream row via the web form:

1. **Financial Rollup**:
   - `Capex_Budget_Cr` automatically sums into the vertical's total outlay and the **Executive Capex vs Revenue Comparison Graph**.
   - `Revenue_Pipeline_Cr` automatically sums into the vertical's revenue forecast on the dashboard.

2. **Status Composition Graph**:
   - The status selected (`On Track`, `Delayed`, `Blocked`, `Completed`) automatically updates the **Operational Status Mix Pie Chart** across all 8 verticals.

3. **Management Attention List**:
   - If a workstream is marked `Blocked`, `Delayed`, or has text in `Vice_Chairman_Decision_Action`, it appears in real time on the **Vice Chairman Attention Table** on the Executive Control Tower homepage (`/executive`).
