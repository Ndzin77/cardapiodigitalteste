const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RegisterRequest {
  action: "register";
  store_id: string;
  phone: string;
  name: string;
  password: string;
}

interface LoginRequest {
  action: "login";
  store_id: string;
  phone: string;
  password: string;
}

interface SetPasswordRequest {
  action: "set_password";
  customer_id: string;
  password: string;
}

interface ResetPasswordRequest {
  action: "reset_password";
  customer_id: string;
}

type RequestBody = RegisterRequest | LoginRequest | SetPasswordRequest | ResetPasswordRequest;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(phone: string) {
  return String(phone || "").replace(/\D/g, "");
}

function base64FromBytes(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function bytesFromBase64(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Secure hashing with PBKDF2 (native WebCrypto, no deps)
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256" as const;

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    256,
  );

  const hashBytes = new Uint8Array(bits);
  const saltB64 = base64FromBytes(salt);
  const hashB64 = base64FromBytes(hashBytes);

  // format: pbkdf2_sha256$iterations$salt$hash
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${saltB64}$${hashB64}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4) return false;
  const [alg, iterStr, saltB64, hashB64] = parts;
  if (alg !== "pbkdf2_sha256") return false;
  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations < 10_000) return false;

  const salt = bytesFromBase64(saltB64);
  const expected = bytesFromBase64(hashB64);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    expected.length * 8,
  );

  const actual = new Uint8Array(bits);

  // constant-time compare
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

function getEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function restHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function restGet<T>(pathWithQuery: string, key: string): Promise<T> {
  const url = `${getEnv("SUPABASE_URL")}${pathWithQuery}`;
  const res = await fetch(url, { headers: restHeaders(key) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as any)?.message || (data as any)?.error || `HTTP ${res.status}`);
  return data as T;
}

async function restPost<T>(path: string, body: unknown, key: string, preferReturn = true): Promise<T> {
  const url = `${getEnv("SUPABASE_URL")}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...restHeaders(key),
      ...(preferReturn ? { Prefer: "return=representation" } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as any)?.message || (data as any)?.error || `HTTP ${res.status}`);
  return data as T;
}

async function restPatch<T>(pathWithQuery: string, body: unknown, key: string, preferReturn = false): Promise<T> {
  const url = `${getEnv("SUPABASE_URL")}${pathWithQuery}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...restHeaders(key),
      ...(preferReturn ? { Prefer: "return=representation" } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as any)?.message || (data as any)?.error || `HTTP ${res.status}`);
  return data as T;
}

async function getUserIdFromAuthHeader(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ||
    Deno.env.get("SUPABASE_ANON_PUBLIC_KEY") ||
    Deno.env.get("SUPABASE_ANON_PUBLIC") ||
    "";
  if (!anonKey) return null;

  const url = `${getEnv("SUPABASE_URL")}/auth/v1/user`;
  const res = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) return null;
  return (data as any)?.id || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const body: RequestBody = await req.json();

    switch (body.action) {
      case "register": {
        const { store_id, phone, name, password } = body as RegisterRequest;
        if (!store_id || !phone || !name || !password) {
          return json(400, { error: "Campos obrigatórios faltando" });
        }
        if (password.length < 4) {
          return json(400, { error: "Senha deve ter no mínimo 4 caracteres" });
        }

        const normalizedPhone = normalizePhone(phone);

        const query = new URLSearchParams({
          select: "id,name,password_hash",
          store_id: `eq.${store_id}`,
          phone: `eq.${normalizedPhone}`,
          limit: "1",
        });

        const existingArr = await restGet<any[]>(`/rest/v1/customers?${query.toString()}`, serviceKey);
        const existing = existingArr?.[0];

        if (existing) {
          if (existing.password_hash) {
            return json(409, { error: "Este telefone já está cadastrado. Faça login." });
          }

          const passwordHash = await hashPassword(password);
          await restPatch(`/rest/v1/customers?id=eq.${existing.id}`, { password_hash: passwordHash, name }, serviceKey);

          return json(200, {
            success: true,
            customer_id: existing.id,
            customer_name: name,
            message: "Senha criada com sucesso",
          });
        }

        const passwordHash = await hashPassword(password);
        const created = await restPost<any[]>(
          "/rest/v1/customers",
          {
            store_id,
            phone: normalizedPhone,
            name,
            password_hash: passwordHash,
          },
          serviceKey,
          true,
        );

        const newCustomer = created?.[0];
        if (!newCustomer?.id) throw new Error("Falha ao criar cliente");

        return json(201, {
          success: true,
          customer_id: newCustomer.id,
          customer_name: name,
          message: "Conta criada com sucesso",
        });
      }

      case "login": {
        const { store_id, phone, password } = body as LoginRequest;
        if (!store_id || !phone || !password) {
          return json(400, { error: "Campos obrigatórios faltando" });
        }

        const normalizedPhone = normalizePhone(phone);
        const query = new URLSearchParams({
          select: "id,name,password_hash",
          store_id: `eq.${store_id}`,
          phone: `eq.${normalizedPhone}`,
          limit: "1",
        });

        const arr = await restGet<any[]>(`/rest/v1/customers?${query.toString()}`, serviceKey);
        const customer = arr?.[0];

        if (!customer) {
          return json(404, { error: "Telefone não encontrado. Cadastre-se primeiro." });
        }

        if (!customer.password_hash) {
          return json(401, {
            error: "Senha não definida",
            needs_password: true,
            customer_id: customer.id,
            customer_name: customer.name,
          });
        }

        const isValid = await verifyPassword(password, customer.password_hash);
        if (!isValid) {
          return json(401, { error: "Senha incorreta" });
        }

        await restPatch(`/rest/v1/customers?id=eq.${customer.id}`, { last_login_at: new Date().toISOString() }, serviceKey);

        return json(200, {
          success: true,
          customer_id: customer.id,
          customer_name: customer.name,
        });
      }

      case "set_password": {
        const { customer_id, password } = body as SetPasswordRequest;
        if (!customer_id || !password) {
          return json(400, { error: "Campos obrigatórios faltando" });
        }
        if (password.length < 4) {
          return json(400, { error: "Senha deve ter no mínimo 4 caracteres" });
        }

        const passwordHash = await hashPassword(password);
        await restPatch(
          `/rest/v1/customers?id=eq.${customer_id}`,
          { password_hash: passwordHash, last_login_at: new Date().toISOString() },
          serviceKey,
        );

        return json(200, { success: true, message: "Senha definida com sucesso" });
      }

      case "reset_password": {
        const { customer_id } = body as ResetPasswordRequest;
        if (!customer_id) return json(400, { error: "Campos obrigatórios faltando" });

        const userId = await getUserIdFromAuthHeader(req);
        if (!userId) return json(401, { error: "Não autorizado" });

        const qCust = new URLSearchParams({ select: "store_id", id: `eq.${customer_id}`, limit: "1" });
        const custArr = await restGet<any[]>(`/rest/v1/customers?${qCust.toString()}`, serviceKey);
        const cust = custArr?.[0];
        if (!cust?.store_id) return json(404, { error: "Cliente não encontrado" });

        const qStore = new URLSearchParams({ select: "user_id", id: `eq.${cust.store_id}`, limit: "1" });
        const storeArr = await restGet<any[]>(`/rest/v1/stores?${qStore.toString()}`, serviceKey);
        const store = storeArr?.[0];

        if (!store?.user_id || store.user_id !== userId) {
          return json(403, { error: "Não autorizado" });
        }

        await restPatch(`/rest/v1/customers?id=eq.${customer_id}`, { password_hash: null }, serviceKey);

        return json(200, {
          success: true,
          message: "Senha removida. Cliente pode criar nova senha.",
        });
      }

      default:
        return json(400, { error: "Ação inválida" });
    }
  } catch (error: any) {
    console.error("Error in customer-auth function:", error);
    return json(500, { error: error?.message || "Erro interno" });
  }
});
