Title: Lessons from Scaling Enterprise RAG: Data Residency, Multi-Tenancy, and Production Reliability
Date: 2026-01-31 12:00
Category: Case Studies
Slug: rag-infrastructure-pgvector
Summary: Patterns and tradeoffs from building RAG infrastructure in regulated environments.
Featured: true

**Disclaimer:** This post reflects general patterns and lessons learned from building enterprise RAG systems. Technical details have been generalized, and no proprietary information from any specific organization is disclosed.

---

## The Problem

The thing that surprised me most when working on enterprise data discovery was how much time analysts spent just finding data. Not analyzing it. Finding it.

The workflow is predictable in large organizations: an analyst needs specific data, knows it exists somewhere in the data warehouse, but which table? What do the columns mean? TX_AMT_CD doesn't exactly scream "transaction amount code."

So they search Confluence, Slack, internal wikis. Book office hours with data engineering. Wait days. Get pointed to someone else. Repeat.

By the time they find the right table and understand the schema, they've burned significant time. Across large analyst populations, that adds up fast. In environments I've worked in, estimates suggested 30-40% of analyst time was going to data discovery, not actual analysis.

The root cause is structural: hundreds of tables across multiple databases, inconsistent documentation, tribal knowledge trapped in people's heads, and compliance layers that make self-service nearly impossible.

The solution? RAG-based data discovery platforms.

---

## Constraints That Shape Everything

I want to walk through common enterprise requirements first because they shape essentially every architectural decision.

**Scale & Multi-Tenancy:** Enterprise deployments often serve thousands of analysts across multiple business units. Users from one business unit typically can't see another unit's data, not just for privacy reasons, but regulatory compliance. This is non-negotiable in regulated industries.

**Latency:** A reasonable starting target is 10-15 seconds end-to-end, with room to optimize down to 5-10 seconds for most queries. Pure vector retrieval can hit sub-100ms. Complex agentic queries with multi-step reasoning and tool use take longer, these benefit from async orchestration so users can keep working while queries run in the background.

**Strong Consistency Over Availability:** This is the classic CAP theorem tradeoff. For financial or compliance-sensitive data, consistency wins. A compliance violation from stale embeddings is worse than temporary unavailability.

**Data Residency:** This is often the killer constraint in regulated industries. All data must stay within the organization's network. No third-party vendors, no data leaving your VPCs. SOC2 compliance, audit trails, CISO sign-off. Many teams underestimate how much this constraint eliminates from your solution space.

**Audit Trails:** SCD Type 2 (Slowly Changing Dimension) for everything is common in regulated environments. When metadata changes, you need to track who made the change, when, and what the previous value was. This serves compliance but also eases debugging, if retrieval quality suddenly drops, you need to know whether someone changed the underlying data.

**Aggressive Timelines:** Enterprise projects often face pressure to deliver POCs in weeks and production systems in months, while still navigating security reviews and compliance approvals.

---

## Vector Database Evaluation

### The Candidates

**ChromaDB** is fast to spin up and great for local development. But it's designed for local storage: cloud-backed infrastructure that scales across availability zones requires something else.

**Pinecone** is often the most tempting option. Managed infrastructure, excellent indexing performance, auto-scaling out of the box. But data residency requirements often kill it. You can't send financial metadata to a third-party vendor outside your network. Same issue with other managed services, even enterprise deployments may face CISO approval timelines that blow past deadlines.

**Self-hosted options** (Weaviate, Milvus, etc.) add complexity: new infrastructure to provision, new failure modes to understand, new security reviews to navigate.

That often leaves **PGVector on managed Postgres** (e.g., AWS RDS Aurora, Cloud SQL).

### Why PGVector Often Wins in Enterprise

Once you lay out regulated-industry constraints, the decision often becomes obvious:

- **Data residency:** Everything stays in your VPC
- **Team expertise:** Most teams already have deep Postgres knowledge
- **Cloud-native:** No new infrastructure to provision
- **Compliance path:** Easier approval since security teams likely have existing Postgres runbooks
- **Migration flexibility:** If you need a specialized vector DB later, you're not locked in

The real question is whether PGVector can meet latency requirements.

### Indexing Strategy: HNSW vs. IVFFlat

**HNSW (Hierarchical Navigable Small World)** offers high recall with relatively low latency and supports incremental updates. But at scale:

- **Write amplification:** Insertions trigger cascading graph modifications
- **Memory overhead:** Graph traversal requires random access patterns, meaning the dataset essentially needs to be in memory

**Quantization helps:**
- **Product Quantization (PQ)** can give 4-64x compression
- **Scalar Quantization (SQ)** converts float32 to int8 for another 4x reduction

**IVFFlat (Inverted File with Flat compression)** often works better for production:

- **Simpler writes:** Only updates the relevant posting list
- **Disk-based:** Scales without prohibitive memory costs
- **Quantization-compatible:** Works with scalar and binary quantization

The tradeoff is slightly lower recall compared to HNSW, but for metadata retrieval (not semantic similarity at extreme precision), the difference is often negligible.

### Mitigations

**Hybrid search complexity:** PGVector handles vector similarity well, but keyword search (BM25) requires manual integration. Consider pg_search or similar extensions to add BM25 scoring alongside vector similarity.

**Scaling past millions of vectors:** PGVector's performance can degrade past ~5-10M vectors on a single instance. Sharding by business unit maps naturally to multi-tenancy requirements anyway.

**Memory pressure:** Even with quantization, large-scale vector search pressures memory. Aggressive index tuning (ef_search and lists parameters optimized per corpus size) helps.

---

## Architecture Patterns

### Typical Stack

**Data Layer:**
- PGVector (IVFFlat + scalar quantization) on managed Postgres
- Sharded by business unit
- Standard embedding models (e.g., text-embedding-3-large)

**Infrastructure:**
- Container orchestration (EKS, ECS, or similar)
- Separated embedding service for background processing
- Standard load balancing and API gateway patterns

**Observability:**
- APM tooling (Datadog, Splunk, Dynatrace, etc.)
- Distributed tracing (Honeycomb, Logfire, etc.)
- Infrastructure as code, standard CI/CD pipelines

### Multi-Tenancy Implementation

Each business unit can get its own database instance. When users authenticate, route queries to their unit's database based on auth metadata.

Implement defense in depth: application-level filtering AND row-level security in Postgres as a backstop.

For metadata editing, data owners can update descriptions through a separate UI. Changes get versioned using SCD Type 2. Only users in the appropriate business unit can edit their metadata.

### Moving Beyond LangChain

LangChain is fast to prototype with, but teams often hit walls at scale:

- **Query inflexibility:** `similarity_search()` is fine for simple queries. Complex filters, joins, and CTEs become painful.
- **Connection management:** LangChain manages its own connections, which can conflict with existing pooling infrastructure.
- **Rigid table structure:** LangChain expects a specific schema that may not fit audit trail and multi-tenancy requirements.
- **Naive inserts:** `add_documents()` does row-by-row inserts. Bulk operations need COPY, upserts, and async processing.

The solution is often pure **SQLAlchemy + Psycopg:**

```python
from sqlalchemy import select

def similarity_search(
    session: Session,
    query_embedding: list[float],
    user_id: UUID,
    min_similarity: float = 0.7,
    limit: int = 10
) -> list[tuple[Document, float]]:
    distance = Document.embedding.cosine_distance(query_embedding)
    
    stmt = (
        select(Document, (1 - distance).label('similarity'))
        .where(
            and_(
                1 - distance >= min_similarity,
                Document.user_id == user_id,
                Document.invalid == 0
            )
        )
        .order_by(distance)
        .limit(limit)
    )
    
    return session.execute(stmt).all()
```

For bulk inserts, Postgres COPY can deliver 10-50x throughput improvements over row-by-row inserts.

### Zero-Downtime Re-Embedding

**The problem:** New data appears regularly. Re-embedding large corpora takes hours. You can't take the system down.

**The solution:** Atomic collection swaps via temporary tables.

- **Trigger:** Scheduled jobs + event-driven triggers for priority updates
- **Process:** Pull new metadata → Batch embed on separate service → Insert into temporary collection
- **Atomic swap:** Single transaction: rename production → old, rename temp → production, drop old
- **Zero downtime:** Users query the old table during the entire embedding process

```python
@contextmanager
def atomic_collection_update(vector_store, collection_type):
    production_name = vector_store.collection_name
    temp_name = f"{production_name}_temp_{uuid.uuid4().hex[:8]}"
    
    temp_store = create_vector_store(temp_name)
    temp_store.create_collection()
    
    try:
        yield temp_store
        
        with temp_store._engine.begin() as conn:
            conn.execute(f"ALTER TABLE {production_name} RENAME TO {production_name}_old")
            conn.execute(f"ALTER TABLE {temp_name} RENAME TO {production_name}")
            conn.execute(f"DROP TABLE {production_name}_old")
    except Exception as e:
        temp_store.delete_collection()
        raise e
```

---

## Production Lessons

### Security

**Jailbreak protection:** DSPy-style iterative prompt hardening works well. In practice, prompt engineering is often sufficient: fine-tuning requires quality data pairs that most teams don't have.

**Auth hardening:** Defense in depth matters. JWT claim verification on every request, row-level security as a backstop, circuit breakers that fail closed on auth service timeouts.

### Timeout Tuning

Each layer needs different tuning:

- **API Gateway:** Default timeouts are often too short for complex queries
- **Load balancer idle timeout:** Too short for WebSocket connections streaming LLM tokens
- **Database connection timeout:** Balance keeping connections alive vs. pool exhaustion

There's no universal configuration. Tune based on production observations.

### Scaling Patterns

Usage spikes by time of day and business unit are common. Memory is typically the critical bottleneck, which pushes toward IVFFlat + quantization.

Auto-scaling helps, but over-provisioning during known high-traffic windows is often worth the cost when analyst productivity is the metric.

### Observability

**Metrics that matter:**
- Query latency (p95 and p99—p50 hides real problems)
- Token count and rate limiting
- DB connection pool utilization
- Error rates by tenant
- Cache hit rate

**Alerts that matter:**
- Consistent timeouts (not one-offs)
- Latency exceeding thresholds for sustained periods
- Connection pool exhaustion

Everything else is often noise.

---

## What I'd Do Differently

### Skip Fine-Tuning (Usually)

Fine-tuning sounds appealing. Custom model, theoretically better performance. In practice, effective prompting is often sufficient. Most teams don't have enough quality data pairs to make LoRA or full fine-tuning effective, and the marginal improvement rarely justifies the complexity cost.

### Use LangGraph from the Start

Building custom agent orchestration works, but LangGraph provides better abstractions for stateful agent workflows without rigid class hierarchies.

### Implement Tracing on Day 1

Adding observability reactively (after things break) is painful. LangSmith or Logfire from day one helps with:
- Audit logs for understanding agent decisions
- Debugging multi-step reasoning failures
- Pattern recognition to reduce support load

### Context Graphs as First-Class Citizens

SCD Type 2 audit trails are a primitive version of what the industry now calls context graphs. If building today, I'd make agent traces first-class:
- Track every tool call
- Log reasoning steps
- Store confidence scores
- Make it all queryable

---

## Key Takeaways

1. **Data residency kills most vendor solutions** in regulated industries. Self-hosted is often the only realistic option.

2. **Strong consistency over availability** when wrong data is worse than no data.

3. **Boring tech wins at scale.** PGVector on managed Postgres isn't exciting, but it works within constraints.

4. **Multi-tenancy is hard.** Shard early. Defense in depth matters.

5. **Prompt engineering over fine-tuning** for most use cases.

6. **Trust beats features.** Ship something simple and reliable. Prove yourself. Then iterate.

7. **Observability from day 1.** You can't fix what you can't see.

8. **Zero-downtime updates are non-negotiable.** Atomic swaps prevent maintenance windows.

---

## Final Thoughts

Enterprise RAG isn't about building the most cutting-edge system or using the fanciest vector database. It's about building reliable infrastructure that works within strict constraints: data residency, compliance, multi-tenancy, strong consistency.

The users don't care what vector database you used. They care whether they can find the right data in seconds instead of hours.

That's the real metric.

---

*Sohail Mohammad is a Senior AI Engineer specializing in production ML infrastructure and agent systems. You can find him on [LinkedIn](https://linkedin.com/in/sohail-mo) and [GitHub](https://github.com/sohailm25).*
