export async function GET() {
  return Response.json({ settings: {} });
}

export async function POST() {
  return Response.json({ message: "Settings saved" });
}
