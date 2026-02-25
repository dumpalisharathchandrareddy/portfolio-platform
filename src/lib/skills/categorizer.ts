// src/lib/skills/categorizer.ts

/**
 * Hard-coded skill taxonomy + categorizer.
 * - Used for resume extraction AND manual skill entry.
 * - Keeps behavior stable across deployments.
 */

export const norm = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9+.#/ -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export type CategoryKey =
  | "Programming Languages"
  | "Backend & APIs"
  | "Frontend"
  | "Databases"
  | "Cloud & DevOps"
  | "AI & Machine Learning"
  | "Data Engineering"
  | "Messaging & Streaming"
  | "Testing & QA"
  | "Security"
  | "Tools & Platforms"
  | "Observability"
  | "Mobile"
  | "Operating Systems"
  | "Other";

export const CATEGORY_ORDER: CategoryKey[] = [
  "Programming Languages",
  "Backend & APIs",
  "Frontend",
  "Databases",
  "Cloud & DevOps",
  "AI & Machine Learning",
  "Data Engineering",
  "Messaging & Streaming",
  "Testing & QA",
  "Security",
  "Observability",
  "Tools & Platforms",
  "Mobile",
  "Operating Systems",
  "Other",
];

/**
 * Canonical skills per category.
 * Tip: keep these human-facing (good display names).
 */
export const CATEGORY_SKILLS: Record<CategoryKey, string[]> = {
  "Programming Languages": [
    // Core
    "Java",
    "Java 8",
    "Java 11",
    "Java 17",
    "Java 21",
    "Python",
    "C",
    "C++",
    "C#",
    "Go",
    "Golang",
    "Rust",
    "Kotlin",
    "Swift",
    "Scala",
    "R",
    "Dart",
    "JavaScript",
    "TypeScript",
    "SQL",
    "Bash",
    "Shell",
    "PowerShell",
    // Extras
    "PHP",
    "Ruby",
    "MATLAB",
    "Lua",
  ],

  "Backend & APIs": [
    // Java ecosystem
    "Spring",
    "Spring Boot",
    "Spring MVC",
    "Spring Security",
    "Spring Cloud",
    "Hibernate",
    "JPA",
    "Jakarta EE",
    "Maven",
    "Gradle",

    // APIs & architectures
    "REST",
    "REST API",
    "GraphQL",
    "gRPC",
    "Microservices",
    "Monolith",
    "Event-driven Architecture",
    "Domain-Driven Design",

    // Auth
    "OAuth",
    "OAuth2",
    "OpenID Connect",
    "JWT",
    "SSO",

    // Node / Python / .NET
    "Node.js",
    "Express",
    "NestJS",
    "FastAPI",
    "Flask",
    "Django",
    "ASP.NET",
    ".NET",

    // API Gateways / Server
    "Nginx",
    "Apache",

    // Patterns
    "Caching",
    "Rate Limiting",
    "Circuit Breaker",
    "Service Discovery",
  ],

  Frontend: [
    "React",
    "Next.js",
    "Angular",
    "Vue",
    "Svelte",
    "Redux",
    "Zustand",
    "React Query",
    "TanStack Query",
    "HTML",
    "CSS",
    "Sass",
    "Tailwind",
    "Bootstrap",
    "Material UI",
    "Shadcn",
    "Webpack",
    "Vite",
    "Babel",
    "ESLint",
    "Prettier",
  ],

  Databases: [
    // Relational
    "PostgreSQL",
    "MySQL",
    "SQL Server",
    "Oracle",
    "SQLite",

    // NoSQL / Search
    "MongoDB",
    "DynamoDB",
    "Cassandra",
    "Redis",
    "Elasticsearch",
    "OpenSearch",

    // ORM
    "Prisma",
    "TypeORM",
    "Sequelize",
  ],

  "Cloud & DevOps": [
    // AWS
    "AWS",
    "EC2",
    "Lambda",
    "S3",
    "RDS",
    "DynamoDB",
    "ECS",
    "EKS",
    "API Gateway",
    "CloudWatch",
    "IAM",
    "Route 53",
    "CloudFront",
    "SQS",
    "SNS",

    // Other clouds
    "Azure",
    "GCP",

    // Containers / IaC
    "Docker",
    "Kubernetes",
    "Helm",
    "Terraform",
    "Ansible",

    // CI/CD
    "Jenkins",
    "GitHub Actions",
    "GitLab CI",
    "CircleCI",
    "CI/CD",

    // Ops
    "Linux",
    "Load Balancing",
    "Autoscaling",
    "Blue-Green Deployment",
    "Canary Deployment",
  ],

  "AI & Machine Learning": [
    "AI",
    "Machine Learning",
    "ML",
    "Deep Learning",
    "NLP",
    "Computer Vision",
    "LLM",
    "Transformers",
    "RAG",
    "Embeddings",
    "Vector Database",

    // Tooling
    "PyTorch",
    "TensorFlow",
    "Keras",
    "scikit-learn",
    "XGBoost",
    "LightGBM",
    "Pandas",
    "NumPy",
    "OpenCV",

    // MLOps / LLM frameworks
    "MLflow",
    "Kubeflow",
    "LangChain",
    "LlamaIndex",
  ],

  "Data Engineering": [
    "ETL",
    "ELT",
    "Airflow",
    "Spark",
    "PySpark",
    "Hadoop",
    "Databricks",
    "Kafka Connect",
    "dbt",
    "Data Warehouse",
    "Snowflake",
    "BigQuery",
    "Redshift",
  ],

  "Messaging & Streaming": [
    "Kafka",
    "RabbitMQ",
    "Kinesis",
    "SQS",
    "SNS",
    "Pub/Sub",
    "Event-driven",
  ],

  "Testing & QA": [
    "JUnit",
    "Mockito",
    "TestNG",
    "Jest",
    "Vitest",
    "Cypress",
    "Playwright",
    "Selenium",
    "Postman",
    "Newman",
    "Integration Testing",
    "Unit Testing",
    "E2E Testing",
  ],

  Security: [
    "OAuth2",
    "OpenID Connect",
    "JWT",
    "OWASP",
    "Security",
    "SAST",
    "DAST",
    "TLS",
    "SSL",
    "Encryption",
    "RBAC",
    "ABAC",
    "Secrets Management",
  ],

  "Tools & Platforms": [
    "Git",
    "GitHub",
    "GitLab",
    "Bitbucket",
    "VS Code",
    "IntelliJ",
    "Jira",
    "Confluence",
    "Figma",
    "Notion",
    "Postman",
    "Swagger",
    "OpenAPI",
    "Storybook",
  ],

  Observability: [
    "ELK",
    "Splunk",
    "Prometheus",
    "Grafana",
    "OpenTelemetry",
    "Jaeger",
    "Datadog",
    "Logging",
    "Monitoring",
    "Tracing",
    "APM",
  ],

  Mobile: ["Flutter", "Dart", "Android", "iOS", "React Native"],

  "Operating Systems": ["Linux", "Ubuntu", "macOS", "Windows"],

  Other: [],
};

// ------------------------------
// Lookup + synonym rules
// ------------------------------

const LOOKUP = (() => {
  const map = new Map<string, CategoryKey>();

  (Object.keys(CATEGORY_SKILLS) as CategoryKey[]).forEach((cat) => {
    for (const skill of CATEGORY_SKILLS[cat]) {
      map.set(norm(skill), cat);
    }
  });

  // synonym -> category
  const synonyms: Array<[string, string, CategoryKey]> = [
    ["springboot", "spring boot", "Backend & APIs"],
    ["spring security", "spring-security", "Backend & APIs"],
    ["node", "node.js", "Backend & APIs"],
    ["expressjs", "express", "Backend & APIs"],
    ["nextjs", "next.js", "Frontend"],
    ["reactjs", "react", "Frontend"],
    ["ts", "typescript", "Programming Languages"],
    ["js", "javascript", "Programming Languages"],
    ["postgres", "postgresql", "Databases"],
    ["mongo", "mongodb", "Databases"],
    ["k8s", "kubernetes", "Cloud & DevOps"],
    ["tf", "terraform", "Cloud & DevOps"],
    ["cicd", "ci/cd", "Cloud & DevOps"],
    ["github actions", "gh actions", "Cloud & DevOps"],
    ["mlops", "ml ops", "AI & Machine Learning"],
    ["rag", "retrieval augmented generation", "AI & Machine Learning"],
    ["oidc", "openid connect", "Security"],
    ["observability", "monitoring", "Observability"],
  ];

  for (const [a, b, cat] of synonyms) {
    map.set(norm(a), cat);
    map.set(norm(b), cat);
  }

  return map;
})();

function hasToken(haystackNorm: string, tokenNorm: string) {
  // word-ish boundary match to avoid accidental partials
  // e.g. "go" should not match "mongodb"
  if (!tokenNorm) return false;
  if (tokenNorm.length <= 2) {
    const re = new RegExp(`(^|\\s)${tokenNorm.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(\\s|$)`);
    return re.test(haystackNorm);
  }
  return haystackNorm.includes(tokenNorm);
}

export function guessCategory(skillName: string): CategoryKey {
  const raw = String(skillName ?? "").trim();
  const key = norm(raw);
  if (!key) return "Other";

  const direct = LOOKUP.get(key);
  if (direct) return direct;

  // token-based best-effort contains match
  for (const [k, cat] of LOOKUP.entries()) {
    if (k.length >= 3 && hasToken(key, k)) return cat;
  }

  // regex fallbacks
  if (/(spring|hibernate|jpa|jakarta|api|rest|graphql|grpc|microservice|oauth|jwt)/i.test(raw))
    return "Backend & APIs";
  if (/(react|next|vue|angular|tailwind|css|html|redux)/i.test(raw)) return "Frontend";
  if (/(postgres|mysql|mongodb|redis|elastic|opensearch|dynamo|sql|oracle|sqlite)/i.test(raw))
    return "Databases";
  if (/(aws|azure|gcp|docker|kubernetes|terraform|jenkins|ci\/?cd|devops|ecs|eks|lambda)/i.test(raw))
    return "Cloud & DevOps";
  if (/(ml|machine learning|ai|nlp|pytorch|tensorflow|llm|rag|embedding|langchain|llamaindex)/i.test(raw))
    return "AI & Machine Learning";
  if (/(airflow|spark|pyspark|hadoop|databricks|dbt|warehouse|snowflake|bigquery|redshift)/i.test(raw))
    return "Data Engineering";
  if (/(kafka|rabbitmq|sqs|sns|kinesis|pub\/?sub)/i.test(raw)) return "Messaging & Streaming";
  if (/(junit|mockito|jest|vitest|cypress|playwright|selenium|testing|postman)/i.test(raw))
    return "Testing & QA";
  if (/(security|owasp|tls|ssl|encryption|rbac|abac|sast|dast|secrets)/i.test(raw)) return "Security";
  if (/(prometheus|grafana|opentelemetry|jaeger|datadog|splunk|elk|observability|monitoring|tracing|logging)/i.test(raw))
    return "Observability";
  if (/(flutter|dart|android|ios|react native)/i.test(raw)) return "Mobile";
  if (/(linux|ubuntu|macos|windows)/i.test(raw)) return "Operating Systems";

  return "Other";
}

/**
 * If you have a comma/newline separated string, split it safely.
 * Example input: "Java, Spring Boot\nAWS"
 */
export function splitSkills(input: string): string[] {
  return String(input ?? "")
    .split(/[\n,]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Takes a list of skill names and returns grouped categories.
 * Example: ["Java", "React", "AWS"] -> { "Programming Languages": ["Java"], "Frontend": ["React"], ... }
 */
export function categorizeSkills(skills: string[]) {
  const grouped: Record<string, string[]> = {};

  for (const raw of skills ?? []) {
    const s = String(raw ?? "").trim();
    if (!s) continue;

    const cat = guessCategory(s) ?? "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  }

  for (const k of Object.keys(grouped)) {
    const seen = new Set<string>();
    grouped[k] = grouped[k].filter((x) => {
      const n = norm(x);
      if (!n) return false;
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });

    grouped[k].sort((a, b) => norm(a).localeCompare(norm(b)));
  }

  return grouped;
}