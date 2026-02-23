// src/lib/skills/categorizer.ts

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9+.#/ -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type CategoryKey =
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

const CATEGORY_SKILLS: Record<CategoryKey, string[]> = {
  "Programming Languages": [
    "Java",
    "Java 8",
    "Java 11",
    "Java 17",
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
    "JavaScript",
    "TypeScript",
    "SQL",
    "Bash",
    "Shell",
    "PowerShell",
  ],
  "Backend & APIs": [
    "Spring",
    "Spring Boot",
    "Spring MVC",
    "Spring Security",
    "Spring Cloud",
    "Hibernate",
    "JPA",
    "REST",
    "REST API",
    "GraphQL",
    "gRPC",
    "Microservices",
    "OAuth",
    "OAuth2",
    "JWT",
    "SSO",
    "Node.js",
    "Express",
    "NestJS",
    "Django",
    "Flask",
    "FastAPI",
    "Ruby on Rails",
    "ASP.NET",
    ".NET",
  ],
  Frontend: [
    "React",
    "Next.js",
    "Vue",
    "Angular",
    "Redux",
    "Zustand",
    "React Query",
    "HTML",
    "CSS",
    "Tailwind",
    "Bootstrap",
    "Material UI",
    "Shadcn",
    "Webpack",
    "Vite",
  ],
  Databases: [
    "PostgreSQL",
    "MySQL",
    "SQL Server",
    "Oracle",
    "MongoDB",
    "DynamoDB",
    "Redis",
    "Elasticsearch",
    "OpenSearch",
    "Cassandra",
    "SQLite",
    "Prisma",
  ],
  "Cloud & DevOps": [
    "AWS",
    "EC2",
    "Lambda",
    "RDS",
    "ECS",
    "EKS",
    "S3",
    "API Gateway",
    "CloudWatch",
    "IAM",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Helm",
    "Terraform",
    "Ansible",
    "Jenkins",
    "GitHub Actions",
    "GitLab CI",
    "CI/CD",
    "Nginx",
    "Linux",
  ],
  "AI & Machine Learning": [
    "Machine Learning",
    "ML",
    "Deep Learning",
    "AI",
    "NLP",
    "LLM",
    "Transformers",
    "PyTorch",
    "TensorFlow",
    "Keras",
    "Scikit-learn",
    "XGBoost",
    "Pandas",
    "NumPy",
    "OpenCV",
    "LangChain",
    "RAG",
    "Vector Database",
    "Embeddings",
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
    "SQS",
    "SNS",
    "Kinesis",
    "Event-driven",
    "Pub/Sub",
  ],
  "Testing & QA": [
    "JUnit",
    "Mockito",
    "Jest",
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
    "Prisma",
    "Postman",
    "Figma",
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
  ],
  Mobile: ["Flutter", "Dart", "Android", "iOS", "React Native"],
  "Operating Systems": ["Linux", "Ubuntu", "macOS", "Windows"],
  Other: [],
};

// lookup
const LOOKUP = (() => {
  const map = new Map<string, CategoryKey>();

  (Object.keys(CATEGORY_SKILLS) as CategoryKey[]).forEach((cat) => {
    CATEGORY_SKILLS[cat].forEach((skill) => {
      map.set(norm(skill), cat);
    });
  });

  const synonyms: Array<[string, string, CategoryKey]> = [
    ["springboot", "spring boot", "Backend & APIs"],
    ["node", "node.js", "Backend & APIs"],
    ["nextjs", "next.js", "Frontend"],
    ["reactjs", "react", "Frontend"],
    ["postgres", "postgresql", "Databases"],
    ["k8s", "kubernetes", "Cloud & DevOps"],
    ["tf", "terraform", "Cloud & DevOps"],
    ["ci cd", "ci/cd", "Cloud & DevOps"],
    ["mlops", "ml ops", "AI & Machine Learning"],
    ["rag", "rag", "AI & Machine Learning"],
  ];

  for (const [a, b, cat] of synonyms) {
    map.set(norm(a), cat);
    map.set(norm(b), cat);
  }

  return map;
})();

export function guessCategory(skillName: string): string | null {
  const key = norm(skillName);
  if (!key) return null;

  const direct = LOOKUP.get(key);
  if (direct) return direct;

  for (const [k, cat] of LOOKUP.entries()) {
    if (k.length >= 4 && key.includes(k)) return cat;
  }

  if (/(spring|hibernate|jpa|api|rest|graphql|grpc|microservice|oauth|jwt)/i.test(skillName))
    return "Backend & APIs";
  if (/(react|next|vue|angular|tailwind|css|html)/i.test(skillName))
    return "Frontend";
  if (/(postgres|mysql|mongodb|redis|elastic|dynamo|sql)/i.test(skillName))
    return "Databases";
  if (/(aws|azure|gcp|docker|kubernetes|terraform|jenkins|ci\/cd|devops)/i.test(skillName))
    return "Cloud & DevOps";
  if (/(ml|machine learning|ai|nlp|pytorch|tensorflow|llm|rag|embedding)/i.test(skillName))
    return "AI & Machine Learning";
  if (/(kafka|rabbitmq|sqs|sns|kinesis|pub\/sub)/i.test(skillName))
    return "Messaging & Streaming";
  if (/(junit|jest|cypress|playwright|selenium|testing)/i.test(skillName))
    return "Testing & QA";
  if (/(security|owasp|tls|ssl|encryption|rbac)/i.test(skillName))
    return "Security";

  return "Other";
}

/**
 * If you have a comma/newline separated string, split it safely.
 * Example input: "Java, Spring Boot\nAWS"
 */
export function splitSkills(input: string): string[] {
  return input
    .split(/[\n,]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * ✅ This is what your code expects:
 * It takes an array of skill names and returns grouped categories.
 */
export function categorizeSkills(skills: string[]) {
  const grouped: Record<string, string[]> = {};

  for (const raw of skills) {
    const s = raw?.trim();
    if (!s) continue;

    const cat = guessCategory(s) ?? "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  }

  // de-dupe within each category (case-insensitive)
  for (const k of Object.keys(grouped)) {
    const seen = new Set<string>();
    grouped[k] = grouped[k].filter((x) => {
      const n = norm(x);
      if (!n) return false;
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }

  return grouped;
}