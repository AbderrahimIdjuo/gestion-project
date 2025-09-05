// Ce fichier est nécessaire pour que Clerk fonctionne correctement avec Next.js 13+
// Il gère les routes d'API d'authentification

export async function GET() {
  return new Response("Auth API endpoint", { status: 200 });
}

export async function POST() {
  return new Response("Auth API endpoint", { status: 200 });
}


