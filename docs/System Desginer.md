# System Design Interview Prep \- Phase 1

# **Revised Phase 1 Vision**

The goal of revised Phase 1:

* interactive architecture editor  
* persistent interview sessions  
* graph-based architecture representation  
* topology-aware rule engine  
* deterministic architecture feedback  
* scalable backend foundations

Importantly:

# **still NO heavy LLM orchestration yet.**

That comes in Phase 2\.

---

# **PHASE 1 FINAL OBJECTIVE**

At the end of Phase 1, a user should be able to:

1. Login/signup  
2. Start a system design interview  
3. Select a prompt  
4. Build architecture visually  
5. Save architecture automatically  
6. Receive structural architecture feedback  
7. Resume/edit sessions  
8. View warnings/recommendations

That is already an extremely solid MVP.

---

# **Revised Core Architecture**

Frontend (Next.js \+ React Flow)  
        |  
REST API (NestJS)  
        |  
\---------------------------------------------------------  
|        |          |          |          |             |  
Auth   Sessions   Diagram   Evaluation   Prompt       Rules  
Module   Module    Module      Engine    Module       Engine  
        |  
\---------------------------------------------------------  
        |  
PostgreSQL \+ Redis

The biggest addition:

# **Evaluation Engine \+ Rules Engine**

This becomes the technical core.

---

# **Technology Stack**

# **Frontend**

* Next.js  
* TypeScript  
* Tailwind  
* React Flow  
* Zustand  
* React Query

# **Backend**

* NestJS  
* Prisma ORM

# **Database**

* PostgreSQL

# **Cache**

* Redis

# **Infra**

* Docker  
* Docker Compose

# **Deployment**

* Vercel \+ Railway/Render/AWS

---

# **CORE ENGINEERING PHILOSOPHY**

# **Treat diagrams as graphs.**

This changes everything.

Your architecture diagrams are:

Nodes \+ Edges

Which means:

* graph traversal  
* topology validation  
* architecture analysis  
* anti-pattern detection

become possible.

This is now a serious systems engineering project.

---

# **Revised Project Structure**

# **Backend Structure**

backend/  
 ├── src/  
 │  
 │── auth/  
 │── users/  
 │── sessions/  
 │── diagrams/  
 │── prompts/  
 │  
 │── evaluation/  
 │    ├── engine/  
 │    ├── graph/  
 │    ├── rules/  
 │    ├── analyzers/  
 │    ├── scorers/  
 │    └── templates/  
 │  
 │── common/  
 │── config/  
 │── database/

This structure is VERY important.

It shows:

* separation of concerns  
* scalability  
* maintainability

---

# **Revised Frontend Structure**

frontend/  
 ├── app/  
 ├── components/  
 │    ├── canvas/  
 │    ├── evaluation/  
 │    ├── interview/  
 │    └── ui/  
 ├── store/  
 ├── services/  
 ├── hooks/  
 ├── lib/  
 └── types/

---

# **PHASE 1 IMPLEMENTATION ROADMAP**

# **WEEK 1 — Project Foundation**

# **1\. Setup Monorepo**

Use:

# **TurboRepo**

Structure:

system-design-platform/  
 ├── apps/  
 │    ├── frontend/  
 │    └── backend/  
 │  
 ├── packages/  
 │    ├── shared-types/  
 │    ├── ui/  
 │    └── eslint-config/  
 │  
 └── docs/

This instantly makes the project look professional.

---

# **2\. Setup Backend**

Install:

* NestJS  
* Prisma  
* PostgreSQL  
* Redis  
* JWT auth

---

# **3\. Setup Frontend**

Install:

* Next.js  
* React Flow  
* Zustand  
* Tailwind  
* React Query

---

# **WEEK 2 — Database Design**

This is extremely important.

---

# **Core Entities**

# **USERS**

User  
\- id  
\- email  
\- passwordHash  
\- createdAt

---

# **PROMPTS**

Prompt  
\- id  
\- title  
\- description  
\- difficulty  
\- expectedPatterns  
\- evaluationTemplate

Important:  
Store evaluation metadata WITH prompts.

---

# **INTERVIEW SESSIONS**

InterviewSession  
\- id  
\- userId  
\- promptId  
\- currentStage  
\- status  
\- createdAt  
\- updatedAt

---

# **DIAGRAMS**

Diagram  
\- id  
\- sessionId  
\- nodes (JSONB)  
\- edges (JSONB)  
\- version  
\- updatedAt

JSONB is PERFECT here.

---

# **EVALUATION RESULTS**

EvaluationResult  
\- id  
\- sessionId  
\- warnings (JSONB)  
\- strengths (JSONB)  
\- score  
\- generatedAt

---

# **WEEK 3 — Authentication \+ Session Management**

# **Features**

## **Auth**

* signup  
* login  
* JWT auth  
* refresh tokens

## **Sessions**

* create interview session  
* resume session  
* list past sessions

---

# **Session Flow**

User selects prompt  
        ↓  
Create InterviewSession  
        ↓  
Initialize empty Diagram  
        ↓  
Open architecture canvas

---

# **WEEK 4 — Interactive Diagram System**

This is your first MAJOR milestone.

# **Use React Flow**

---

# **Supported Node Types**

VERY IMPORTANT:  
Keep node types controlled.

CLIENT  
API\_GATEWAY  
LOAD\_BALANCER  
SERVICE  
CACHE  
DATABASE  
QUEUE  
CDN  
OBJECT\_STORAGE  
AUTH\_SERVICE  
SEARCH\_SERVICE

This enables deterministic validation.

---

# **Diagram Data Model**

interface DiagramNode {  
  id: string;  
  type: NodeType;  
  position: XYPosition;

  data: {  
    label: string;  
    metadata?: Record\<string, any\>;  
  };  
}

---

# **Required Features**

## **Canvas Features**

* drag/drop nodes  
* connect nodes  
* delete nodes  
* rename nodes  
* zoom/pan  
* autosave

---

# **Autosave Flow**

Diagram change  
      ↓  
Local Zustand state  
      ↓  
Debounced save  
      ↓  
Backend persistence  
      ↓  
PostgreSQL JSONB storage

This demonstrates good frontend architecture.

---

# **WEEK 5 — Graph Engine**

This is where the project becomes technically impressive.

# **Build Internal Graph Representation**

---

# **Graph Builder**

Convert:

{  
  "nodes": \[\],  
  "edges": \[\]  
}

into:

class ArchitectureGraph {  
  nodes: Map\<string, Node\>;  
  adjacencyList: Map\<string, string\[\]\>;  
}

---

# **Graph Responsibilities**

Your graph engine should support:

* neighbor lookup  
* path traversal  
* topology analysis  
* layer validation  
* anti-pattern detection

---

# **WEEK 6 — Rule Engine**

This is the CORE of revised Phase 1\.

---

# **Evaluation Philosophy**

NOT:

Correct / Incorrect

INSTEAD:

Strengths  
Warnings  
Potential bottlenecks  
Missing considerations

---

# **Rule Engine Architecture**

Diagram  
   ↓  
Graph Builder  
   ↓  
Rule Engine  
   ↓  
Feedback Generator

---

# **Rule Categories**

# **1\. Flow Rules**

Detect:

CLIENT → DATABASE

Warn:

Direct DB access detected.

---

# **2\. Layering Rules**

Preferred:

Client → Gateway → Service → DB

Detect violations.

---

# **3\. Scaling Rules**

Detect:

* single DB bottlenecks  
* lack of caching  
* no load balancing

---

# **4\. Reliability Rules**

Detect:

* SPOFs  
* lack of redundancy  
* missing failover

---

# **5\. Async Processing Rules**

For systems like:

* YouTube  
* Uber  
* WhatsApp

detect absence of:

* queues  
* async workers  
* event pipelines

---

# **Example Rule Interface**

interface EvaluationRule {  
  evaluate(  
    graph: ArchitectureGraph,  
    context: PromptContext  
  ): RuleResult\[\];  
}

---

# **Example Rule**

class DirectDatabaseAccessRule {  
  evaluate(graph) {  
    ...  
  }  
}

This is clean architecture.

---

# **WEEK 7 — Prompt Templates**

# **Store Evaluation Templates**

Example:

{  
  "prompt": "Design YouTube",

  "requiredConcepts": \[  
    "cdn",  
    "object\_storage",  
    "async\_processing"  
  \],

  "antiPatterns": \[  
    "direct\_db\_access"  
  \]  
}

This becomes your evaluation baseline.

---

# **WEEK 8 — Feedback UI**

Create:

# **Architecture Insights Panel**

---

# **Example Output**

Detected Strengths  
✓ CDN layer present  
✓ Load balancing detected

Potential Concerns  
⚠ Single DB may bottleneck  
⚠ No async processing pipeline

Recommendations  
• Add queue-based transcoding  
• Consider DB replication

This already feels intelligent.

---

# **WEEK 9 — Deployment \+ CI/CD**

# **Deployment**

Frontend:

* Vercel

Backend:

* Railway / Render / AWS

DB:

* Supabase PostgreSQL

Redis:

* Upstash

---

# **Add CI/CD**

GitHub Actions:

* lint  
* build  
* tests

Very important for engineering credibility.

---

# **WHAT PHASE 1 NOW DEMONSTRATES**

Your project now demonstrates:

## **Systems Engineering**

* graph modeling  
* topology analysis  
* architecture validation

## **Backend Engineering**

* modular APIs  
* persistence  
* autosave  
* scalable state management

## **Frontend Engineering**

* interactive graph UI  
* state synchronization

## **Platform Thinking**

* deterministic evaluation  
* structured workflows  
* architecture-aware analysis

That is FAR more impressive than:

“AI chatbot app”

---

# **WHAT GETS DEFERRED TO PHASE 2**

Phase 2 becomes:

# **intelligent interviewer behavior.**

Including:

* conversational AI  
* dynamic questioning  
* tradeoff analysis  
* contextual follow-ups  
* RAG  
* architecture reasoning  
* adaptive interview flow

That separation is now architecturally clean and very strong.

