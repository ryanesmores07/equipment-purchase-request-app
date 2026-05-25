import { createClient, type User } from "@supabase/supabase-js";

type SeedRole = "employee" | "admin";

type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  role: SeedRole;
};

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

const supabase = createClient(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const seedUsers: SeedUser[] = [
  {
    email: requiredEnv("SEED_EMPLOYEE_EMAIL"),
    password: requiredEnv("SEED_EMPLOYEE_PASSWORD"),
    fullName: "Seed Employee",
    role: "employee",
  },
  {
    email: optionalEnv("SEED_EMPLOYEE_2_EMAIL", "employee2@example.com"),
    password: optionalEnv("SEED_EMPLOYEE_2_PASSWORD", "Employee234!"),
    fullName: "Seed Employee 2",
    role: "employee",
  },
  {
    email: requiredEnv("SEED_ADMIN_EMAIL"),
    password: requiredEnv("SEED_ADMIN_PASSWORD"),
    fullName: "Seed Admin",
    role: "admin",
  },
];

async function findUserByEmail(email: string): Promise<User | null> {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw error;
    }

    const found = data.users.find((user) => user.email === email);

    if (found) {
      return found;
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }
}

async function getOrCreateUser(seedUser: SeedUser): Promise<User> {
  const existing = await findUserByEmail(seedUser.email);

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: seedUser.email,
    password: seedUser.password,
    email_confirm: true,
    user_metadata: {
      full_name: seedUser.fullName,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error(`Failed to create user ${seedUser.email}`);
  }

  return data.user;
}

async function upsertProfile(user: User, seedUser: SeedUser) {
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: seedUser.email,
    full_name: seedUser.fullName,
    role: seedUser.role,
  });

  if (error) {
    throw error;
  }
}

async function main() {
  for (const seedUser of seedUsers) {
    const user = await getOrCreateUser(seedUser);
    await upsertProfile(user, seedUser);
    console.log(`Seeded ${seedUser.role}: ${seedUser.email}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
