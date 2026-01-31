Title: Building RAG Infrastructure for 15,000 Users: Why We Chose PGVector Over Pinecone
Date: 2026-01-31 12:00
Category: Technical
Slug: rag-infrastructure-pgvector
Summary: A production case study from JPMorgan Chase on scaling enterprise RAG with data residency constraints, multi-tenancy, and 99.9% uptime.

*A production case study from JPMorgan Chase on scaling enterprise RAG with data residency constraints, multi-tenancy, and 99.9% uptime*

---

## The Problem: Analysts Weren't Analyzing

Our analysts weren't analyzing—they were searching.

Before we built Chase Data Detective, a typical workflow looked like this: An analyst needs to compile a report on credit card fraud patterns. They know the data exists somewhere in our Snowflake warehouse, but which table? What's it called? What do the columns actually mean?

So they start searching. PG Admin. Confluence docs. Teams messages. Internal wikis. Slack channels. They find a table that *might* be right, but the schema isn't documented. Column names like `TX_AMT_CD` don't exactly scream "transaction amount code." So they book office hours with the data engineering team. Wait three days for the meeting. Get pointed to another person who might know. Repeat.

By the time they actually find the right table and understand what the columns represent, they've burned 8-12 hours. And they haven't written a single line of analysis yet.

This wasn't an edge case. Across our 15,000+ analysts in four lines of business—asset management, investment banking, card services, commercial banking—we estimated **30-40% of their time was spent on data discovery, not data analysis.** That's the equivalent of losing 2 days per week, per analyst.

The root cause? Our data lived in hundreds of tables across multiple databases, with inconsistent documentation, tribal knowledge trapped in people's heads, and—because we're a financial institution—layers of compliance and permissioning that made self-service nearly impossible.

We needed to fix this.

---

## Requirements: What Success Looked Like

The constraints guided everything we built.

**Scale & Multi-Tenancy**

We were building for 10,000-15,000 analysts across four distinct lines of business. Each LOB had its own telemetry data tracking the most-used tables for their reports. This meant **strict multi-tenant architecture**: users from asset management shouldn't see card services data, period. Not just for privacy—for regulatory compliance.

**Latency Targets**

We started with a modest 15-second end-to-end latency target. As we optimized, we drove it down to 5-10 seconds. Eventually, we hit **sub-100ms for pure vector retrieval**—though some complex agentic queries (with tool use and multi-step reasoning, similar to [OpenAI's internal data agent](https://openai.com/index/inside-our-in-house-data-agent/)) could take 5-10 minutes. The key was **async agent orchestration** so users could keep working while queries ran in the background.

**Strong Consistency Over Availability**

In classical CAP theorem terms, we chose **strong consistency over availability.** Financial data can't be wrong. Period. We can't be held liable for analyst reports containing inaccuracies because our vector search returned stale embeddings. If the system went down, that's annoying. If it returned wrong data, that's a compliance violation. The choice was obvious.

**Data Residency & Compliance**

This was the killer constraint: **data must stay within the JPMC network.** No third-party vendors. No data leaving our VPC. SOC2 compliance, audit trails, CISO sign-off—these weren't nice-to-haves. They were gate requirements.

We also needed **SCD Type 2 audit trails** for everything. When a data owner updated a table description, we had to track who changed it, when, and what the old value was. Not just for compliance—for debugging. If retrieval quality suddenly dropped, we needed to know if someone changed the metadata.

(Side note: This SCD Type 2 approach turned out to be prescient. Months later, the industry started talking about [context graphs](https://foundationcapital.com/context-graphs-ais-trillion-dollar-opportunity/) and [agent trace standards](https://agent-trace.dev/). We were already doing it, just for boring compliance reasons.)

**Timeline**

POC in 30 days. Production in 90 days. Scale to 10,000+ users within a year.

The 90-day timeline wasn't arbitrary—it accounted for the typical red tape in enterprise: security reviews, CISO approval, infrastructure provisioning, legal sign-off. We couldn't control that process, but we could control how fast we built.

---

## Vector Database Evaluation: Why We Chose PGVector

### The Candidates

We started with **ChromaDB** for the initial prototype. It was fast to spin up and great for local development. But we hit a wall almost immediately: ChromaDB is designed for local storage, and we needed a cloud-backed solution that could scale across multiple availability zones. So we moved to evaluating production-grade options.

**Pinecone** was the most tempting. Full feature set, managed infrastructure, excellent indexing performance, auto-scaling out of the box. But **data residency killed it.** We couldn't send financial table metadata to a third-party vendor outside the JPMC network. Same issue with **Qdrant** and other managed services. Even if they offered enterprise deployments, the CISO approval process would've blown our 90-day timeline.

We also looked at **Weaviate** and a few other self-hosted options. But each one added complexity: new infrastructure to provision, new failure modes to understand, new security reviews to navigate.

That left **PGVector on AWS RDS Aurora.**

### Why PGVector Won

The decision was almost obvious once we laid out the constraints:

- **Data residency:** Everything stayed in our VPC. No data leaving the JPMC network.
- **Team familiarity:** We already had deep Postgres expertise. Our DBAs knew how to tune it, monitor it, scale it.
- **AWS RDS native:** No new infrastructure to provision. Just enable the extension.
- **Compliance path:** Easier SOC2 approval since it's AWS-managed Postgres. Our security team already had runbooks.
- **Migration flexibility:** If we needed to switch later (say, to a specialized vector DB), we weren't locked in. PGVector is just Postgres.

But the real question was: **Could PGVector meet our latency requirements?**

### Indexing Strategy: HNSW → IVFFlat

We started with **HNSW (Hierarchical Navigable Small World)** indexing because it offered high recall with relatively low latency—critical for real-time retrieval. HNSW also supports incremental updates, which we needed as analysts continuously added new table metadata.

But HNSW has downsides:

- **Insertion/deletion costs:** Updating the index triggers cascading graph modifications throughout the structure, causing write amplification. This makes insertions slow and resource-intensive.
- **Memory overhead:** Traversing HNSW's graph structure involves highly random access patterns. The entire dataset must be stored in memory to achieve reasonable performance. For our 100M+ document corpus, that memory requirement would've been prohibitive.

**Mitigation: Quantization**

We used quantization to compress the vector space:

- **Product Quantization (PQ):** Divided the vector space into subspaces, quantizing each independently. Achieved 4x-64x compression ratios in our tests, enabling finer compression and faster approximate searches.
- **Scalar Quantization (SQ):** Quantized each dimension independently by converting from float32 to int8, achieving 4x compression.

This reduced memory overhead enough to make HNSW viable for our POC.

**Production Switch: IVFFlat**

After validating the POC, we switched to **IVFFlat (Inverted File with Flat compression)** for production deployment. IVFFlat offered practical advantages over HNSW:

- **Simpler insertions/deletions:** Only requires updating the relevant posting list, no cascading graph modifications.
- **Disk-based storage:** Scales efficiently without prohibitive memory costs.
- **Quantization compatible:** Works seamlessly with scalar and binary quantization for further optimization.

The tradeoff was slightly lower recall compared to HNSW, but in practice, the difference was negligible for our use case (retrieving table metadata, not semantic similarity at extreme precision).

### What We Had to Mitigate

PGVector isn't perfect. We knew the limitations going in:

**1. Hybrid Search Complexity**

PGVector handles vector similarity well, but keyword search (BM25) requires manual integration. For the POC, we shipped with pure vector retrieval—good enough to validate the concept. But for production, we knew analysts would need hybrid search: "Find tables related to 'fraud detection' that also mention 'credit card transactions.'"

We integrated the **pg_search extension** to add BM25 scoring alongside vector similarity. This let us combine semantic search (understanding intent) with keyword matching (exact terms). The tradeoff: more code to maintain, and query complexity increased.

**2. Scaling Past 5-10M Vectors**

PGVector's performance degrades past ~5-10M vectors on a single RDS instance. With 100M+ documents across four lines of business, we'd hit that wall fast.

Our solution: **shard by line of business.** Each LOB got its own RDS Aurora instance. This mapped naturally to our multi-tenancy requirements anyway—asset management analysts never queried card services data, so why share infrastructure?

This also simplified compliance: each LOB's data stayed in its own isolated environment, making audit trails cleaner.

**3. Memory Pressure**

Even with quantization, large-scale vector search puts pressure on memory. We mitigated this with:

- **Scalar quantization** (float32 → int8) for 4x compression
- **Aggressive index tuning:** `ef_search` and `lists` parameters optimized per LOB based on corpus size
- **Larger RDS instance types** where justified—we weren't optimizing for cost, we were optimizing for analyst productivity

**The Decision**

PGVector with IVFFlat + scalar quantization gave us:

- Sub-100ms vector retrieval (p95)
- Strong consistency guarantees (Postgres ACID)
- Data residency compliance
- A 30-day POC and 90-day production timeline

We weren't chasing the bleeding edge. We were optimizing for **boring tech that worked** within our constraints.

---

## Architecture: Building for Scale and Compliance

### The Stack

**Data Layer:**
- **PGVector** (IVFFlat + scalar quantization) on **AWS RDS Aurora**
- Sharded by line of business (4 separate Aurora instances)
- **text-embedding-3-large** from OpenAI for embeddings
- **GPT-4o** (POC), **Azure OpenAI** (production) for LLM inference

**Infrastructure:**
- **ECS Fargate** for POC (UI and backend services)
- **EKS (Kubernetes)** for production with Helm charts
- Separated **embedding service** (ECS Fargate) for background processing
- **Application Load Balancer** (ALB) and **Network Load Balancer** (NLB)
- **API Gateway** for routing

**Observability & DevOps:**
- **Datadog** + **CloudWatch** initially
- Later: **Splunk** + **Dynatrace** (corporate decision)
- **Honeycomb** for tracing, later **Logfire**
- Custom agent trace implementation
- **Terraform** for infrastructure-as-code
- **Jules/Jenkins/Spinnaker** for CI/CD

### Multi-Tenancy: Sharding by Line of Business

Each LOB got its own RDS Aurora instance. When a user logged in, the application routed their queries to their LOB's database based on auth metadata (group membership, stored in a central auth DB).

We also implemented **application-level filtering** and **row-level security** in Postgres to ensure users only saw their own data, even if routing somehow failed. Defense in depth.

**Metadata Editing UI**

Data owners (product managers, data engineers) could update table descriptions, column descriptions, and valid value metadata through a separate UI. Changes were versioned using SCD Type 2: each update created a new row with `valid_from` and `valid_to` timestamps. Old rows were marked invalid (max int in an `invalid` field) but never deleted—full audit trail.

Only users in the appropriate LOB could edit their own metadata. Cross-LOB contamination was impossible by design.

### Data Model: Vectors + Metadata + Audit Trail

Each row in our vector table looked like this:

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    content TEXT NOT NULL,               -- Vectorized content (table/column description)
    embedding VECTOR(1536),              -- text-embedding-3-large output
    metadata JSONB,                      -- Full pre-vectorization metadata (table name, schema, etc.)
    source_id UUID,                      -- Link back to source (Snowflake table)
    analyst_id UUID,                     -- For filtering by user
    valid_from TIMESTAMP,                -- SCD Type 2: when this version became valid
    valid_to TIMESTAMP,                  -- When it was superseded (NULL if current)
    invalid INT DEFAULT 0,               -- Max int if invalidated
    created_at TIMESTAMP DEFAULT NOW()
);
```

The **JSONB blob** stored the original metadata before vectorization: table name, schema name, database name, column list, valid values. This let us show analysts the full context when they clicked on a result.

### From LangChain to Custom SQLAlchemy: The 3x Throughput Improvement

We started with **LangChain** because it was fast to prototype. But we quickly hit walls:

**LangChain's Limitations at Scale:**

1. **Query inflexibility:** LangChain's `similarity_search()` is great for simple queries, but we needed complex filters:
   - Filter by `user_id AND created_at > last_week AND status IN ('active', 'pending')`
   - Join against another table before returning results
   - Use CTEs or subqueries for access control
   - LangChain's abstractions made this painful.

2. **Connection management:** LangChain creates its own connections and engines under the hood. We already had connection pooling configured (pgbouncer, SQLAlchemy pool, read replicas). LangChain's layer fought with ours.

3. **Rigid table structure:** LangChain expects `id | embedding | document | cmetadata (JSONB)`. We needed custom columns for audit trails, user filtering, and multi-tenancy.

4. **Naive inserts:** LangChain's `add_documents()` does row-by-row inserts. We needed:
   - **COPY** for bulk loads (10-50x faster)
   - **Upsert logic** (ON CONFLICT)
   - **Batch size tuning** for memory
   - **Async inserts** for background processing

**Our Solution: Custom SQLAlchemy Layer**

We replaced LangChain's VectorStore with pure **SQLAlchemy + Psycopg**. ORM models with a thin query builder layer:

```python
# Simplified example (actual implementation was more complex)
from sqlalchemy import select

def similarity_search(
    session: Session,
    query_embedding: list[float],
    analyst_id: UUID,
    min_similarity: float = 0.7,
    limit: int = 10
) -> list[tuple[Document, float]]:
    distance = Document.embedding.cosine_distance(query_embedding)
    
    stmt = (
        select(Document, (1 - distance).label('similarity'))
        .where(
            and_(
                1 - distance >= min_similarity,
                Document.analyst_id == analyst_id,
                Document.invalid == 0  # Only active records
            )
        )
        .order_by(distance)
        .limit(limit)
    )
    
    return session.execute(stmt).all()
```

For bulk inserts, we used Postgres **COPY**:

```python
def bulk_insert_embeddings(conn, documents: list[dict]):
    """COPY is 10-50x faster than individual INSERTs"""
    buffer = StringIO()
    for doc in documents:
        embedding_str = '[' + ','.join(map(str, doc['embedding'])) + ']'
        buffer.write(f"{doc['id']}\t{doc['content']}\t{embedding_str}\n")
    
    buffer.seek(0)
    with conn.cursor() as cur:
        cur.copy("COPY documents (id, content, embedding) FROM STDIN")
        while data := buffer.read(8192):
            cur.write(data)
```

**The Result:** 3x throughput improvement. We went from ~300 queries/sec to ~900 queries/sec under load. The combination of COPY bulk inserts, better connection pooling, and async operations was multiplicative.

**What We Kept from LangChain:**

Almost nothing in production. We kept the **AzureChatOpenAI** wrapper (thin, didn't add much abstraction). Everything else—VectorStore, Chains, Retrievers, Document loaders—we replaced with simple functions.

The pattern that worked: **Just write functions.** They compose better than class hierarchies.

### Zero-Downtime Re-Embedding: Atomic Collection Swaps

**The Problem:** Every week, new tables appeared in our telemetry data (most-used tables by analysts). We needed to re-embed the entire corpus to include them. But re-embedding 100M+ documents took **3+ hours.** We couldn't take the system down for that long.

**The Solution:** Atomic collection swaps via temporary tables.

Here's how it worked:

1. **Trigger:** Weekly scheduled job + event-driven (when product manually requested new tables outside telemetry).
2. **Process:**
   - Pull new metadata from Snowflake
   - Batch embed with text-embedding-3-large (separated embedding service on ECS Fargate)
   - Insert into a **temporary collection** (same schema, different table name: `documents_temp_<uuid>`)
3. **Atomic swap:** After all batches successfully inserted:
   - In a single transaction, rename `documents` → `documents_old` and `documents_temp` → `documents`
   - Drop `documents_old` after swap confirmed successful
4. **Zero downtime:** During the 3-hour embedding process, users still queried the old `documents` table. The pointer only switched after the new data was fully validated.

We used a **context manager** to ensure atomicity:

```python
from contextlib import contextmanager

@contextmanager
def atomic_collection_update(vector_store, collection_type):
    production_name = vector_store.collection_name
    temp_name = f"{production_name}_temp_{uuid.uuid4().hex[:8]}"
    
    # Create temporary vector store
    temp_store = PGVector(
        connection_string=vector_store.connection_string,
        embedding_function=vector_store.embedding_function,
        collection_name=temp_name,
    )
    temp_store.create_collection()
    
    try:
        yield temp_store  # Process all batches here
        
        # Atomic swap on success
        with temp_store._engine.begin() as conn:
            conn.execute(f"ALTER TABLE {production_name} RENAME TO {production_name}_old")
            conn.execute(f"ALTER TABLE {temp_name} RENAME TO {production_name}")
            conn.execute(f"DROP TABLE {production_name}_old")
    except Exception as e:
        temp_store.delete_collection()  # Clean up on failure
        raise e
```

This gave us **zero-downtime updates** even with multi-hour re-embedding jobs.

---

## Production Lessons: What Actually Broke

### Jailbreak Protection (That We Never Actually Needed)

We didn't see actual jailbreak attempts in production. But we prepared for them anyway.

We used **DSPy** to iteratively harden our system prompt against adversarial inputs. We also experimented with **GEPA (Genetic Pareto)** for adversarial testing—generating edge-case queries to see if we could trick the LLM into ignoring access controls or returning data from the wrong LOB.

In the end, **prompt engineering was sufficient.** We didn't need fine-tuning (LoRA or full fine-tune). We didn't have enough quality data pairs to make fine-tuning effective anyway, and DSPy's iterative optimization gave us better results faster.

### Authentication & Session Issues

Early on, sessions would drop or users would see the wrong LOB's data (terrifying in a financial institution). We diagnosed this with **Datadog logs** and hardened the auth layer:

- Verified JWT claims on every request
- Added row-level security in Postgres as a backstop
- Implemented circuit breakers to fail closed (deny access) on auth service timeouts

After hardening, we had zero cross-LOB data leakage incidents.

### Timeout Tuning at Every Layer

Timeouts were death by a thousand cuts. We hit bottlenecks at multiple layers:

1. **AWS API Gateway:** Default 30s timeout. Some complex agentic queries (with multi-step tool use) took longer. We tuned Gateway timeouts based on p99 latency.
2. **ALB idle timeout:** Default 60s. For long-polling WebSocket connections (streaming LLM tokens), this was too short. We bumped it to 300s.
3. **Database connection timeout:** Had to balance keeping connections alive vs. not exhausting the pool.

Each layer required different tuning based on production logs and incidents. There's no one-size-fits-all.

### Hot Spots & Auto-Scaling

We saw usage spikes by **time of day** (morning when analysts started work) and by **LOB** (certain lines of business had heavier usage).

**Memory was the critical bottleneck.** This is what eventually pushed us from HNSW to IVFFlat, and forced us to implement quantization. Without it, we'd have needed prohibitively expensive RDS instances.

We used **AWS auto-scaling** for EKS nodes, but we also **over-provisioned** during known high-traffic windows. Analyst productivity was worth the extra cost.

### Observability: What Actually Mattered

**Metrics we tracked:**
- **Query latency:** p95 and p99 (p50 was too optimistic)
- **Token count & rate limiting:** To avoid hitting OpenAI/Azure quotas
- **DB connection pool utilization:** Early warning for scaling issues
- **Error rates by LOB:** To catch LOB-specific issues
- **Cache hit rate:** Improved over time as we extracted patterns from usage

**Alerts that mattered:**
- **Consistent timeouts** (not just one-offs)
- **Query latency exceeding p95 thresholds** for >5 minutes
- **Connection pool exhaustion**

Everything else was noise.

**Debugging slow queries:**

1. Start with **CloudWatch logs** (fastest to query)
2. If logs showed DB latency, use **Postgres EXPLAIN ANALYZE**
3. For complex issues, pull full trace from **Honeycomb** (later **Logfire**)
4. We also built a **custom agent trace** to understand multi-step reasoning loops

**Observability stack evolution:**

- **POC:** Datadog + CloudWatch
- **Production:** Splunk + Dynatrace (corporate mandate, not our choice)
- **Later:** Added Honeycomb for tracing, then migrated to Logfire

### Production Surprises

**Memory leaks from HNSW:** Early on, HNSW's memory overhead caused OOM kills on smaller RDS instances. Moving to IVFFlat + quantization solved it.

**Connection pool exhaustion:** Under heavy load, we'd exhaust the connection pool. Solution: larger pool + better connection lifecycle management (close connections aggressively in error paths).

**No downtime incidents:** After the initial hardening period, we hit **99.9% uptime** with zero major outages. The atomic swap strategy for re-embedding was key.

---

## Results: Trust Beats Features

### The Numbers

- **10,000-15,000 users** across 4 lines of business
- **100M+ documents** in the vector corpus
- **Sub-100ms vector retrieval** (p95)
- **5-10s end-to-end latency** for most queries (some agentic queries took 5-10 minutes, similar to [OpenAI's async agent approach](https://x.com/AlexReibman/status/1965923096445296869))
- **99.9% uptime** with zero downtime incidents after production hardening
- **POC in 30 days, production in 90 days**
- **Improved cache hit rate** over time as usage patterns stabilized

### What Actually Mattered: Trust Over Features

The metrics look good on paper, but the real story was about **trust.**

Adoption was slow at first. Analysts didn't trust a black-box AI tool to give them the right table names. And they were right to be skeptical—financial data mistakes have consequences.

So we focused on **proving ourselves incrementally:**

1. **Simple working MVP > complex feature set:** We shipped with pure vector search first. No agentic tool use, no multi-step reasoning. Just "here's the table you're probably looking for." Once that worked reliably, we added more.

2. **Tight feedback loops:** We embedded with analysts (literally—sat with them for weeks). Asked what they needed, what broke, what was confusing. We didn't implement every feature request, but we developed **taste for patterns.** What increases trust? What actually gets used?

3. **Data quality feedback loop:** The biggest win wasn't technical—it was organizational. Data owners (product managers, data engineers) started taking ownership of metadata quality. They realized that if their table descriptions were vague, analysts couldn't find their tables. So they improved descriptions. Which improved retrieval quality. Which built more trust. **Virtuous cycle.**

4. **No downtime = credibility:** After the first few months with 99.9% uptime, analysts started trusting the system to be available when they needed it. That trust was hard-won and fragile—one major outage could've killed adoption.

### What We Built After Launch

Once trust was established, we added:

- **Tableau dashboard retrieval:** Analysts could search for existing dashboards, not just raw tables
- **Code snippets in sidebar:** Common SQL patterns for the table they were viewing
- **Async agent orchestration:** Long-running queries (5-10 minutes) ran in the background, similar to OpenAI's data agent approach

But we only added these **after** the core experience was rock-solid.

### The Real Lesson: Internal Users Are Customers

We treated analysts like external customers. **Customer obsession mattered,** even for internal tools.

Features don't matter if they break trust. A simple, reliable system beats a complex, flaky one every time. And adoption—real, sustained adoption—comes from proving yourself incrementally, not launching with a big bang.

---

## What I'd Do Differently

### 1. Skip Fine-Tuning Entirely

Fine-tuning sounded appealing—custom model, better performance, etc. But in practice, **effective prompting was all we needed.**

We didn't have enough high-quality data pairs to make LoRA or full fine-tuning effective. And when we tested it, the improvement was marginal compared to the complexity cost (model versioning, deployment, retraining pipelines).

**DSPy's iterative prompt optimization** gave us better results with less overhead.

### 2. Use LangGraph from the Start

We built our own agent orchestration layer (custom SQLAlchemy, manual tool routing). It worked, but if I started today, I'd use **LangGraph** from day one.

LangGraph gives you better abstractions for stateful agent workflows without forcing you into rigid class hierarchies. It's what we eventually converged toward anyway—might as well start there.

### 3. Implement Tracing on Day 1

We added observability reactively (after things broke). If I could redo it, I'd implement **LangSmith or Logfire from day one.**

Tracing would've helped with:
- **Audit logs:** Understanding what the agent did and why
- **Debugging:** Seeing the full multi-step reasoning chain when queries failed
- **Pattern recognition:** Building something like [Ramp's Inspect](https://ramp.com) to understand usage and reduce on-call support

We eventually built a custom agent trace, but starting with a standard (like [Cursor's agent trace format](https://agent-trace.dev/)) would've been smarter. **Interoperability matters.**

### 4. Context Graphs / Agent Traces as First-Class Citizens

Our SCD Type 2 audit trail turned out to be a primitive version of what the industry now calls **context graphs.** We tracked metadata changes, but we didn't track *why* the agent made certain decisions or *how* it reasoned through ambiguous queries.

If I rebuilt this today, I'd make agent traces a first-class part of the architecture:
- Track every tool call
- Log reasoning steps
- Store confidence scores
- Make it queryable for debugging and improvement

This is where the industry is heading (see [Foundation Capital's context graphs article](https://foundationcapital.com/context-graphs-ais-trillion-dollar-opportunity/) and [agent-trace.dev](https://agent-trace.dev/)). We were ahead on compliance-driven audit trails, but behind on using them for agent improvement.

### 5. More Aggressive Model Experimentation (If Allowed)

We used GPT-4o and Azure OpenAI because that's what was approved by the org. But I would've loved to experiment with:
- **Claude 3.5 Sonnet** for reasoning-heavy queries
- **Smaller, faster models** for simple lookups (not everything needs GPT-4o)
- **Mixture of models** based on query complexity

This wasn't a technical limitation—it was organizational. But if you're building from scratch at a startup, **experiment more aggressively with model selection.**

---

## Key Takeaways

If you're building enterprise RAG infrastructure, here's what mattered for us:

1. **Data residency kills most vendor solutions.** In regulated industries, self-hosted is often the only option. Embrace it.

2. **Strong consistency > availability** when wrong data is worse than no data. Choose your CAP theorem tradeoff deliberately.

3. **Boring tech wins at scale.** PGVector on RDS isn't sexy, but it worked. We didn't need the latest bleeding-edge vector DB.

4. **Multi-tenancy is hard.** Shard early. Don't try to cram everything into one database with application-level filtering—defense in depth matters.

5. **Prompt engineering > fine-tuning** for most use cases. Don't overcomplicate.

6. **Trust beats features.** Ship a simple, reliable MVP. Prove yourself. Then iterate.

7. **Observability from day 1.** You can't fix what you can't see. Invest in tracing early.

8. **Zero-downtime updates are non-negotiable.** Atomic swaps for re-embedding saved us from weekly maintenance windows.

9. **Internal users are customers.** Treat them like it. Tight feedback loops, customer obsession, iterative improvement.

10. **Connection pooling matters.** At scale, naive connection management will kill you. Tune aggressively.

---

## Final Thoughts

We built Chase Data Detective to solve a specific problem: analysts wasting 30-40% of their time searching for data instead of analyzing it.

We didn't build the most cutting-edge RAG system. We didn't use the fanciest vector database. We didn't fine-tune custom models.

We built **boring infrastructure that worked reliably** within strict enterprise constraints: data residency, SOC2 compliance, multi-tenancy, strong consistency, 99.9% uptime.

And it scaled to 10,000-15,000 users with sub-100ms retrieval across 100M+ documents.

If you're building something similar—**optimize for reliability, not novelty.** Prove yourself incrementally. Earn trust before you add complexity.

The analysts don't care what vector database you used. They care whether they can find the right table in 10 seconds instead of 10 hours.

That's the real metric.

---

*Sohail Mohammad is a Senior AI Engineer specializing in production ML infrastructure and agent systems. Previously at JPMorgan Chase, currently at Amazon building agentic platforms for 1.5M+ employees. You can find him on [LinkedIn](https://linkedin.com/in/sohail-mo) and [GitHub](https://github.com/sohailm25).*
