# RIASAT Executive Control Tower: Department Form Filing Guidelines & Operational Standard

> **Ramaiah Institute for Advanced Skills & Technology (RIASAT)**  
> *Executive Decision Support & Management Control Tower*  
> Document Version: 1.0 | Academic & Commissioning Cycle 2026–2027

---

## 1. Executive Summary & Purpose

The RIASAT Executive Control Tower transitions all department reporting from static spreadsheets into a centralized, live PostgreSQL web application. Every submission feeds directly into the **Live Executive Dashboard** for the **Vice Chairman** and **Executive Leadership**.

This document outlines:
1. Core performance metrics (`Readiness Score %`, `RAG Status`)
2. Field-by-field instructions for the 8 departmental overview forms
3. The standard 11-column Workstream Data Entry standard (`Item_ID` to `Vice_Chairman_Decision_Action`)
4. Verification and submission protocol (`Draft` vs `Submit`)

---

## 2. Core Strategic Metrics

### A. Readiness Score (0% to 100%)
Reflects cumulative progress toward institutional commissioning:

| Score Band | Operational Stage | Criteria & Milestones |
| :--- | :--- | :--- |
| **0% – 25%** | **Initiation & Scoping** | Concept finalized; lab layout planned; vendor tenders drafted. |
| **26% – 49%** | **Procurement & Setup** | Orders placed; curriculum draft completed; hiring interviews underway. |
| **50% – 74%** | **Installation & Integration**| Equipment delivered & installed; pilot validation underway; MoUs signed. |
| **75% – 89%** | **Validation & Readiness** | Lab functional; software licenses active; corporate cohorts enrolled. *(Target operational baseline)* |
| **90% – 100%** | **Fully Commissioned** | Regular training & academic batches running; commercial revenue active. |

---

### B. RAG Status Definitions

| Health | Description | Action Required |
| :--- | :--- | :--- |
| **NOT STARTED** | Baseline status before departmental work initiates. | Establish initial deliverable roadmap. |
| **GREEN** | Milestones, budgets, and timelines are fully on track. | Regular monitoring; no executive escalation. |
| **AMBER** | Minor delays (1–3 weeks) or vendor bottlenecks. | Internal mitigation plan documented. |
| **RED** | Critical blockers: regulatory hold, vendor default, vacant chair. | Immediate Vice Chairman intervention. |

---

## 3. Workstream Entry Standards (The 11 Columns)

Every department deliverable must be documented using the standard 11 columns:

```
Item_ID | Workstream_Category | Deliverable_Milestone | Key_Assets_Partnerships_Infrastructure | Target_Date | Status and Actions | Capex_Budget_Cr | Revenue_Pipeline_Cr | Lead_Owner | Risks_Operational_Blockers | Vice_Chairman_Decision_Action
```

### Column Explanations & Format:

1. **`Item_ID`**: Unique reference code (e.g., `WS-01`, `SEM-WS-01`).
2. **`Workstream_Category`**: Standard category (`Infrastructure`, `Lab Equipment & Tooling`, `Curriculum & Academics`, `Industry Partnerships`, `Certifications & Regulatory`, `Monetization & Commercial`).
3. **`Deliverable_Milestone`**: Concrete, verifiable outcome with clear technical or physical scope.
4. **`Key_Assets_Partnerships_Infrastructure`**: Partners, OEMs, software suites, or physical facilities (e.g., *Cadence EDA*, *HAL Avionics*, *ISRO IN-SPACe*).
5. **`Target_Date`**: Specific target completion date (`YYYY-MM-DD`).
6. **`Status and Actions`**: Operational state: `Not Started`, `In Progress`, `On Track`, `Delayed`, `Completed`, `Blocked`, `On Hold`.
7. **`Capex_Budget_Cr`**: Capital expenditure allocated or spent in **₹ Crores** (e.g., `₹ 14.5 Cr`, `₹ 0.0 Cr`).
8. **`Revenue_Pipeline_Cr`**: Anticipated commercial revenue, testing fees, or corporate cohort pipeline in **₹ Crores** (e.g., `₹ 28.0 Cr`).
9. **`Lead_Owner`**: Accountable role or lead (e.g., `Semicon Head`, `Prof. K. Sharma`).
10. **`Risks_Operational_Blockers`**: Active technical, supply-chain, or civil roadblocks. Enter `None` if on track.
11. **`Vice_Chairman_Decision_Action`**: Explicit decision, policy sign-off, or liaison required from the Vice Chairman. Enter `None` if not required.

---

## 4. Vertical Overview Form Fields

### Vertical 1: Semicon
- **Cleanroom Facility**: Cleanroom ISO-5/6/7 civil status, HVAC ducting, HEPA filter integrity, and air shower readiness.
- **Cadence EDA Tooling**: EDA cloud server cluster, node count (e.g., 250 nodes), licensing server activation.
- **Academic Partners**: Joint degree curriculums, university collaborations (IITs, IISc, international partners).
- **Corporate Cohorts**: Skilling batches contracted with semiconductor fabs and ATMP providers (e.g., Tata Electronics, Micron).
- **Vice Chairman Focus**: High-level foundry MoUs, state semiconductor mission approvals, or large capex waivers.

### Vertical 2: Aerospace & Defence
- **Defense Radar Lab**: X-Band / AESA radar test benches, RF anechoic chamber, signal generator setup.
- **Avionics HIL Benches**: Hardware-in-the-Loop flight computers, MIL-STD-1553 bus analyzers, telemetry simulator.
- **Anchor Alliances**: Strategic partnerships with HAL, DRDO labs (ADE, GTRE, LRDE), and private aerospace integrators.
- **Domain Lead**: Onboarding of Chief Technical Advisor, Emeritus Chairs, or defence veterans.
- **Vice Chairman Focus**: Ministry of Defence clearances, DRDO test facility access agreements.

### Vertical 3: Space
- **Satellite Clean Bench**: Class 100 laminar flow payload assembly bench, thermal vacuum testing rig access.
- **Anchor Space Alliance**: IN-SPACe authorization, ISRO center collaboration, private NewSpace startup pacts.
- **Space Agency Advisory**: Technical council chaired by veteran satellite scientists and payload directors.
- **CubeSat Flight Window**: Target launch manifest, orbit specification, and launch vehicle service provider slot.
- **Vice Chairman Focus**: IN-SPACe master authorization sign-off, frequency clearance filings.

### Vertical 4: Cybersecurity
- **Defense Cyber Range**: 100-seat range server stack, attack/defense scenario packs (OT/SCADA, Banking, Defence).
- **SOC Infrastructure**: Student-led 24/7 Security Operations Center, SIEM appliances (Splunk, Elastic).
- **Academic Tier**: CERT-In / NCIIPC aligned PG Diplomas and executive defense skill tracks.
- **Monetization Model**: Corporate threat simulation camps, red-team consulting, and vulnerability testing services.
- **Vice Chairman Focus**: Dedicated high-bandwidth leased line ISP contracts, law-enforcement collaborations.

### Vertical 5: MedTech
- **Clinical Testbed**: Ramaiah Memorial Hospital ward retrofitting for patient monitoring and bio-telemetry.
- **Lab Equipment**: High-fidelity patient simulators, EEG/ECG acquisition systems, surgical simulators.
- **Quality Standards**: ISO 13485 medical device quality management and CDSCO regulatory clearance tracks.
- **Corporate Cohort**: Medical device OEM collaborations (GE Healthcare, Siemens Healthineers, Philips).
- **Vice Chairman Focus**: Hospital administration coordination, hospital works division work orders.

### Vertical 6: Advanced Manufacturing
- **3DEXPERIENCE CoE**: Dassault Systèmes 3DEXPERIENCE platform installation, cloud tenant seats.
- **CAD Workstations**: GPU rendering workstations (HP Z-Series / NVIDIA RTX), CAM post-processors.
- **Manufacturing Facility**: Direct Metal Laser Sintering (DMLS) 3D printer, 5-axis CNC machines, argon gas manifold.
- **Live Capstones**: Live product engineering design contracts from automotive and machinery OEMs.
- **Vice Chairman Focus**: Multi-year enterprise OEM software agreements, customs duty exemptions.

### Vertical 7: HR & Recruitment
- **Total Requisitions**: Total sanctioned roles across domain heads, chairs, and lab engineers.
- **Pipeline Status**: Candidate sourcing velocity, search firm engagement health.
- **Active Interviews**: Candidates currently in panel evaluations and technical rounds.
- **Critical Open Roles**: High-priority director-level leadership openings.
- **Vice Chairman Focus**: Final executive interview loop scheduling, compensation package approvals.

### Vertical 8: Communications
- **Web Portal & Digital Footprint**: Corporate admissions portal, digital campaign performance, social reach.
- **Industry Outreach Summit**: National skills summit date, corporate CEO attendance, conclave agenda.
- **Collateral & Media Assets**: Executive prospectus, printed brochures, institutional video teasers.
- **Strategic Alliances**: CII, FICCI, NASSCOM, IESA institutional partnerships.
- **Vice Chairman Focus**: Chief Guest and Keynote Speaker invitation approvals.

---

## 5. Submission Protocol

- **`Save as Draft`**: Retains your inputs privately in PostgreSQL. Status displays as `DRAFT`.
- **`Submit to Control Tower`**: Promotes data to `SUBMITTED`, publishing verified numbers and RAG ratings to the live Executive Control Tower and Consolidated Status Matrix.
