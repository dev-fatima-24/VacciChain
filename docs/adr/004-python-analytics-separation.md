# ADR-004: Python Analytics Service Separation

## Status
Accepted

## Context
VacciChain requires analytics capabilities for:
- Vaccination rate tracking by region and vaccine type
- Issuer activity monitoring and performance metrics
- Anomaly detection for unusual minting patterns
- Bulk verification operations for institutions
- Data visualization and reporting

The main backend (Node.js/Express) handles core vaccination operations but analytics workloads have different characteristics:
- Data-intensive processing
- Complex statistical computations
- Machine learning potential
- Different performance requirements
- Separate scaling needs

## Decision
We separated analytics functionality into a dedicated Python FastAPI service. This service handles all analytics endpoints, batch operations, and data processing while the Node.js backend focuses on core vaccination operations.

## Consequences

### Positive
- **Specialized tooling**: Python's data science ecosystem (pandas, numpy, scikit-learn)
- **Performance isolation**: Heavy analytics queries don't impact core API performance
- **Independent scaling**: Analytics service can scale based on analytics workload
- **Team specialization**: Data scientists can work on analytics without Node.js expertise
- **Better testing**: Separate testing strategies for analytics vs core functionality
- **Future ML capabilities**: Easy integration with machine learning libraries
- **Clean architecture**: Clear separation of concerns between services

### Negative
- **Deployment complexity**: Additional service to deploy and maintain
- **Network overhead**: Inter-service communication adds latency
- **Data consistency**: Need to ensure data synchronization between services
- **Operational overhead**: Monitoring, logging, and maintenance for multiple services
- **Development coordination**: Changes to data model affect both services

## Alternatives Considered

### Monolithic Node.js Backend
- **Pros**: Single deployment, simpler architecture, shared codebase
- **Cons**: Limited data science tools, performance coupling, scaling challenges
- **Rejected**: Node.js ecosystem lacks mature data science libraries

### Node.js with Python Child Processes
- **Pros**: Single service, Python available for analytics
- **Cons**: Complex process management, resource contention, deployment issues
- **Rejected**: Process management complexity outweighs benefits

### Microservices with Message Queue
- **Pros**: Asynchronous processing, better resilience, event-driven
- **Cons**: Added complexity, eventual consistency, debugging challenges
- **Rejected**: Over-engineering for current analytics requirements

### External Analytics Service
- **Pros**: No maintenance, specialized service, SaaS benefits
- **Cons**: Data privacy concerns, cost, limited customization
- **Rejected**: Healthcare data requires on-premise processing

## Implementation Notes
- FastAPI for high-performance async Python web framework
- Direct database access for analytics queries
- REST API for inter-service communication
- Docker containerization for consistent deployment
- Separate database connection pool for analytics
- Batch processing endpoints for bulk operations
- Rate limiting specific to analytics endpoints

```python
# Analytics Service Architecture
├── main.py              # FastAPI application entry
├── routes/
│   ├── analytics.py     # Vaccination rates, issuer stats
│   └── batch.py         # Bulk verification scripts
├── models/              # Data models and schemas
└── utils/               # Data processing utilities
```

## References
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Python Data Science Stack](https://scipy.org/stackspec.html)
- [Microservices Patterns](https://microservices.io/patterns/)
