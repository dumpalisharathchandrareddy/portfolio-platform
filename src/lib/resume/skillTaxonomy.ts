// src/lib/resume/skillTaxonomy.ts
export type SkillCategoryName =
  | "Programming Languages"
  | "Backend & APIs"
  | "Frontend"
  | "Mobile"
  | "Databases"
  | "Data Engineering"
  | "AI & Machine Learning"
  | "Cloud Platforms"
  | "DevOps & Infrastructure"
  | "Containers & Orchestration"
  | "CI/CD"
  | "Messaging & Streaming"
  | "Observability & Monitoring"
  | "Testing & QA"
  | "Security"
  | "Architecture & Patterns"
  | "Operating Systems"
  | "Networking"
  | "Tools & Productivity"
  | "IT & Support"
  | "Other";

const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[()]/g, "");

function uniqByNorm(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const k = norm(item);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item.trim());
  }
  return out;
}

/**
 * Keywords are matched in 2 ways:
 * - exact match: skill === keyword
 * - contains match: skill includes keyword
 */
type Rule = { name: SkillCategoryName; keywords: string[] };

const RULES: Rule[] = [
  {
    name: "Programming Languages",
    keywords: [
      "java",
      "javascript",
      "typescript",
      "python",
      "c",
      "c++",
      "c#",
      "go",
      "golang",
      "ruby",
      "php",
      "scala",
      "kotlin",
      "swift",
      "rust",
      "r",
      "matlab",
      "bash",
      "shell",
      "powershell",
      "sql",
    ],
  },

  {
    name: "Backend & APIs",
    keywords: [
      "spring",
      "spring boot",
      "spring cloud",
      "spring security",
      "hibernate",
      "jpa",
      "node",
      "node.js",
      "express",
      "nestjs",
      "fastapi",
      "django",
      "flask",
      ".net",
      "asp.net",
      "laravel",
      "graphql",
      "rest",
      "rest api",
      "grpc",
      "microservices",
      "oauth",
      "oauth2",
      "jwt",
      "openid",
      "sso",
      "api gateway",
      "swagger",
      "openapi",
      "postman",
    ],
  },

  {
    name: "Frontend",
    keywords: [
      "react",
      "next.js",
      "nextjs",
      "angular",
      "vue",
      "svelte",
      "redux",
      "zustand",
      "react query",
      "tanstack",
      "html",
      "css",
      "tailwind",
      "bootstrap",
      "material ui",
      "mui",
      "chakra",
      "sass",
      "scss",
      "webpack",
      "vite",
      "babel",
    ],
  },

  {
    name: "Mobile",
    keywords: [
      "android",
      "ios",
      "flutter",
      "react native",
      "kotlin android",
      "swift ios",
      "xcode",
      "jetpack compose",
      "firebase",
    ],
  },

  {
    name: "Databases",
    keywords: [
      "postgres",
      "postgresql",
      "mysql",
      "mariadb",
      "oracle",
      "sql server",
      "mssql",
      "mongodb",
      "dynamodb",
      "cassandra",
      "redis",
      "elasticsearch",
      "opensearch",
      "neo4j",
      "firebase firestore",
      "firestore",
      "cosmos db",
      "sqlite",
    ],
  },

  {
    name: "Data Engineering",
    keywords: [
      "etl",
      "elt",
      "airflow",
      "dagster",
      "dbt",
      "spark",
      "pyspark",
      "hadoop",
      "hive",
      "presto",
      "trino",
      "kafka connect",
      "debezium",
      "snowflake",
      "bigquery",
      "redshift",
      "databricks",
      "lakehouse",
      "data pipeline",
    ],
  },

  {
    name: "AI & Machine Learning",
    keywords: [
      "machine learning",
      "ml",
      "deep learning",
      "dl",
      "ai",
      "artificial intelligence",
      "nlp",
      "computer vision",
      "cv",
      "llm",
      "transformer",
      "bert",
      "gpt",
      "openai",
      "rag",
      "vector database",
      "embeddings",
      "pytorch",
      "torch",
      "tensorflow",
      "keras",
      "scikit-learn",
      "sklearn",
      "xgboost",
      "lightgbm",
      "catboost",
      "mlflow",
      "wandb",
      "weights & biases",
      "hugging face",
      "langchain",
      "llamaindex",
      "onnx",
      "tensorrt",
      "feature store",
      "model serving",
    ],
  },

  {
    name: "Cloud Platforms",
    keywords: [
      "aws",
      "amazon web services",
      "ec2",
      "lambda",
      "rds",
      "ecs",
      "eks",
      "s3",
      "cloudfront",
      "api gateway",
      "cloudwatch",
      "iam",
      "route 53",
      "sns",
      "sqs",
      "dynamodb",
      "azure",
      "azure devops",
      "gcp",
      "google cloud",
      "cloud run",
      "cloud functions",
      "bigquery",
      "firebase",
    ],
  },

  {
    name: "DevOps & Infrastructure",
    keywords: [
      "devops",
      "terraform",
      "pulumi",
      "ansible",
      "chef",
      "puppet",
      "iac",
      "infrastructure as code",
      "nginx",
      "apache",
      "linux admin",
      "load balancer",
      "reverse proxy",
      "system design",
    ],
  },

  {
    name: "Containers & Orchestration",
    keywords: [
      "docker",
      "docker compose",
      "kubernetes",
      "k8s",
      "helm",
      "istio",
      "service mesh",
      "containerd",
    ],
  },

  {
    name: "CI/CD",
    keywords: [
      "ci/cd",
      "jenkins",
      "github actions",
      "gitlab ci",
      "circleci",
      "travis",
      "azure pipelines",
      "buildkite",
      "argo cd",
    ],
  },

  {
    name: "Messaging & Streaming",
    keywords: [
      "kafka",
      "rabbitmq",
      "activemq",
      "sqs",
      "sns",
      "pubsub",
      "google pubsub",
      "event-driven",
      "event driven",
      "streaming",
    ],
  },

  {
    name: "Observability & Monitoring",
    keywords: [
      "prometheus",
      "grafana",
      "elk",
      "elastic stack",
      "splunk",
      "datadog",
      "new relic",
      "opentelemetry",
      "otel",
      "jaeger",
      "zipkin",
      "logging",
      "monitoring",
      "tracing",
    ],
  },

  {
    name: "Testing & QA",
    keywords: [
      "junit",
      "mockito",
      "testng",
      "jest",
      "vitest",
      "cypress",
      "playwright",
      "selenium",
      "postman",
      "swagger",
      "tdd",
      "bdd",
      "integration testing",
      "unit testing",
    ],
  },

  {
    name: "Security",
    keywords: [
      "security",
      "oauth2",
      "jwt",
      "sso",
      "openid",
      "iam",
      "owasp",
      "xss",
      "csrf",
      "sql injection",
      "sast",
      "dast",
      "secrets management",
      "vault",
      "hashicorp vault",
      "ssl",
      "tls",
      "encryption",
    ],
  },

  {
    name: "Architecture & Patterns",
    keywords: [
      "microservices",
      "monolith",
      "soa",
      "event-driven",
      "event driven",
      "ddd",
      "domain driven design",
      "mvc",
      "mvvm",
      "design patterns",
      "solid",
      "clean architecture",
      "distributed systems",
      "scalability",
    ],
  },

  {
    name: "Operating Systems",
    keywords: ["linux", "ubuntu", "debian", "centos", "windows", "macos", "unix"],
  },

  {
    name: "Networking",
    keywords: [
      "http",
      "https",
      "dns",
      "tcp",
      "udp",
      "ip",
      "vpc",
      "subnet",
      "vpn",
      "load balancer",
      "proxy",
      "firewall",
    ],
  },

  {
    name: "Tools & Productivity",
    keywords: [
      "git",
      "github",
      "gitlab",
      "bitbucket",
      "jira",
      "confluence",
      "notion",
      "slack",
      "vscode",
      "visual studio",
      "intellij",
      "eclipse",
      "prisma",
      "npm",
      "yarn",
      "pnpm",
      "maven",
      "gradle",
    ],
  },

  {
    name: "IT & Support",
    keywords: [
      "it support",
      "help desk",
      "service desk",
      "active directory",
      "office 365",
      "microsoft 365",
      "azure ad",
      "ticketing",
      "incident management",
      "problem management",
      "change management",
      "sccm",
      "intune",
    ],
  },
];

function matchRule(skill: string) {
  const s = norm(skill);

  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      const k = norm(kw);
      if (!k) continue;

      // exact match OR contains match
      if (s === k || s.includes(k)) return rule.name;
    }
  }
  return null;
}

export function categorizeSkills(skills: string[]) {
  const categorized = new Map<SkillCategoryName, string[]>();
  const leftovers: string[] = [];

  for (const rawSkill of skills) {
    const skill = rawSkill.trim();
    if (!skill) continue;

    const cat = matchRule(skill);
    if (!cat) {
      leftovers.push(skill);
      continue;
    }

    const arr = categorized.get(cat) ?? [];
    arr.push(skill);
    categorized.set(cat, arr);
  }

  // Dedup per category
  for (const [cat, list] of categorized.entries()) {
    categorized.set(cat, uniqByNorm(list));
  }

  if (leftovers.length) {
    categorized.set("Other", uniqByNorm(leftovers));
  }

  return categorized;
}